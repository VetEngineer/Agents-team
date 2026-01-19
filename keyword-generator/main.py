import argparse
import csv
import json
import logging
import os
import re
import time
from dataclasses import dataclass
from itertools import product
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Sequence, Tuple

import requests
import yaml
from dotenv import load_dotenv


logger = logging.getLogger(__name__)


DELIM_RE = re.compile(r"[,\|/]+")
TAG_RE = re.compile(r"<[^>]+>")


@dataclass
class BusinessContext:
    name: str
    address: str
    services: List[str]
    industries: List[str]
    region_keywords: List[str]
    poi_keywords: List[str]
    longitude: float
    latitude: float


class NaverMapsClient:
    def __init__(self, client_id: str, client_secret: str, base_url: str, delay_sec: float):
        self.client_id = client_id
        self.client_secret = client_secret
        self.base_url = base_url.rstrip("/")
        self.delay_sec = delay_sec
        self._session = requests.Session()

    def _headers(self) -> Dict[str, str]:
        return {
            "X-NCP-APIGW-API-KEY-ID": self.client_id,
            "X-NCP-APIGW-API-KEY": self.client_secret,
        }

    def _get(self, path: str, params: Dict[str, str]) -> Optional[dict]:
        url = f"{self.base_url}{path}"
        response = self._session.get(url, headers=self._headers(), params=params, timeout=15)
        if self.delay_sec > 0:
            time.sleep(self.delay_sec)
        if response.status_code != 200:
            logger.warning("Maps API %s failed: %s", path, response.text[:200])
            return None
        try:
            return response.json()
        except json.JSONDecodeError:
            logger.warning("Maps API %s returned non-JSON", path)
            return None

    def geocode(self, address: str) -> Optional[Tuple[float, float]]:
        data = self._get("/map-geocode/v2/geocode", {"query": address})
        if not data or not data.get("addresses"):
            return None
        first = data["addresses"][0]
        try:
            return float(first["x"]), float(first["y"])
        except (KeyError, ValueError, TypeError):
            return None

    def reverse_geocode(self, longitude: float, latitude: float) -> Optional[dict]:
        params = {
            "coords": f"{longitude},{latitude}",
            "output": "json",
            "orders": "addr,roadaddr",
        }
        return self._get("/map-reversegeocode/v2/gc", params)

    def search_place(
        self,
        query: str,
        longitude: float,
        latitude: float,
        radius_m: int,
        size: int = 50,
        page: int = 1,
    ) -> Optional[dict]:
        params = {
            "query": query,
            "coordinate": f"{longitude},{latitude}",
            "radius": str(radius_m),
            "page": str(page),
            "size": str(size),
            "sort": "distance",
        }
        return self._get("/map-place/v1/search", params)


class NaverLocalClient:
    def __init__(self, client_id: str, client_secret: str, base_url: str, delay_sec: float):
        self.client_id = client_id
        self.client_secret = client_secret
        self.base_url = base_url.rstrip("/")
        self.delay_sec = delay_sec
        self._session = requests.Session()

    def _headers(self) -> Dict[str, str]:
        return {
            "X-Naver-Client-Id": self.client_id,
            "X-Naver-Client-Secret": self.client_secret,
        }

    def search_local(self, query: str, display: int = 5) -> Optional[dict]:
        url = f"{self.base_url}/v1/search/local.json"
        params = {"query": query, "display": str(display), "start": "1", "sort": "sim"}
        response = self._session.get(url, headers=self._headers(), params=params, timeout=15)
        if self.delay_sec > 0:
            time.sleep(self.delay_sec)
        if response.status_code != 200:
            logger.warning("Local API failed: %s", response.text[:200])
            return None
        try:
            return response.json()
        except json.JSONDecodeError:
            logger.warning("Local API returned non-JSON")
            return None


def load_config(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as handle:
        return yaml.safe_load(handle)


def split_terms(text: str) -> List[str]:
    if not text:
        return []
    parts = [part.strip() for part in DELIM_RE.split(text) if part.strip()]
    return list(dict.fromkeys(parts))


def strip_tags(text: str) -> str:
    return TAG_RE.sub("", text or "").strip()


def extract_total(data: dict, items: Sequence[dict]) -> int:
    for key in ("total", "totalCount"):
        if key in data:
            return int(data[key])
    meta = data.get("meta", {})
    for key in ("total", "totalCount"):
        if key in meta:
            return int(meta[key])
    return len(items)


def extract_items(data: dict) -> List[dict]:
    for key in ("places", "items", "addresses"):
        if key in data and isinstance(data[key], list):
            return data[key]
    return []


def extract_place_names(data: dict) -> List[str]:
    items = extract_items(data)
    names = []
    for item in items:
        name = item.get("name") or item.get("title")
        if name:
            names.append(strip_tags(name))
    return names


def extract_place_names_filtered(
    data: dict,
    allowed_categories: Sequence[str],
    allowed_name_keywords: Sequence[str],
) -> List[str]:
    items = extract_items(data)
    names = []
    for item in items:
        name = strip_tags(item.get("name") or item.get("title") or "")
        if not name:
            continue
        category = item.get("category", "") or ""
        matches_category = any(token in category for token in allowed_categories)
        matches_name = any(token in name for token in allowed_name_keywords)
        if allowed_categories or allowed_name_keywords:
            if not (matches_category or matches_name):
                continue
        names.append(name)
    return list(dict.fromkeys(names))


def address_tokens(address: str, region_keywords: Sequence[str]) -> List[str]:
    tokens = re.split(r"[\s\(\)\[\]\-/,]+", address or "")
    tokens = [token.strip() for token in tokens if token.strip()]
    tokens.extend(region_keywords)
    return list(dict.fromkeys(tokens))


def derive_industries(service_text: str, service_terms: List[str], config: dict) -> List[str]:
    synonyms = config.get("industry_synonyms", [])
    for item in synonyms:
        keywords = item.get("keywords", [])
        if any(keyword in service_text for keyword in keywords):
            return [item.get("industry")]
    if service_terms:
        return [service_terms[0]]
    return []


def extract_region_keywords(reverse_data: Optional[dict]) -> List[str]:
    if not reverse_data or "results" not in reverse_data:
        return []
    regions = []
    for result in reverse_data.get("results", []):
        region = result.get("region", {})
        area1 = region.get("area1", {}).get("name")
        area2 = region.get("area2", {}).get("name")
        area3 = region.get("area3", {}).get("name")
        area4 = region.get("area4", {}).get("name")
        if not area1:
            continue
        short_area1 = None
        for suffix in ("특별자치시", "특별시", "광역시", "특별자치도", "자치도", "도", "시"):
            if area1.endswith(suffix) and len(area1) > len(suffix):
                short_area1 = area1[: -len(suffix)]
                break
        if area1.endswith("시") or area1.endswith("광역시") or area1.endswith("특별시"):
            for item in (area1, area2, area3):
                if item:
                    regions.append(item)
        else:
            for item in (area1, area2, area3, area4):
                if item:
                    regions.append(item)
        if short_area1:
            regions.append(short_area1)
    return list(dict.fromkeys([r for r in regions if r]))


def build_local_query(region_keywords: Sequence[str], base_query: str, max_terms: int) -> str:
    region_part = " ".join(region_keywords[:max_terms]) if region_keywords else ""
    if region_part:
        return f"{region_part} {base_query}".strip()
    return base_query.strip()


def filter_pois(pois: Iterable[str], address_terms: Sequence[str]) -> List[str]:
    address_set = set(address_terms)
    filtered = []
    for poi in pois:
        if not poi:
            continue
        if any(term in poi for term in address_set):
            continue
        filtered.append(poi)
    return list(dict.fromkeys(filtered))


def shorten_region_terms(terms: Sequence[str], suffixes: Sequence[str]) -> List[str]:
    shortened = []
    for term in terms:
        for suffix in suffixes:
            if term.endswith(suffix) and len(term) > len(suffix):
                shortened.append(term[: -len(suffix)])
                break
    return list(dict.fromkeys(shortened))


def combine_region_terms(terms: Sequence[str]) -> List[str]:
    combos = []
    if len(terms) < 2:
        return combos
    for first in terms:
        for second in terms:
            if first == second:
                continue
            combos.append(f"{first}{second}")
    return list(dict.fromkeys(combos))


def expand_services(service_text: str, service_terms: List[str], config: dict) -> List[str]:
    keywords_cfg = config.get("keywords", {})
    expanded = list(service_terms)
    expanded.extend(keywords_cfg.get("service_terms", []) or [])
    suffix_rules = keywords_cfg.get("service_suffix_rules", []) or []
    derived: List[str] = []
    for term in expanded:
        for rule in suffix_rules:
            suffix = rule.get("suffix")
            additions = rule.get("add_suffixes", []) or []
            if suffix and term.endswith(suffix):
                base = term[: -len(suffix)]
                if not base:
                    continue
                for add_suffix in additions:
                    derived.append(f"{base}{add_suffix}")
    expanded.extend(derived)
    for item in keywords_cfg.get("service_expansions", []) or []:
        triggers = item.get("trigger_terms", []) or []
        additions = item.get("include_terms", []) or []
        if any(term in service_text for term in triggers) or any(
            term in service for term in triggers for service in service_terms
        ):
            expanded.extend(additions)
    return list(dict.fromkeys([term for term in expanded if term]))


def extract_name_terms(name: str, config: dict) -> List[str]:
    keywords_cfg = config.get("keywords", {})
    base_terms = keywords_cfg.get("name_base_terms", []) or []
    suffix_terms = keywords_cfg.get("name_suffix_terms", []) or []
    include_terms = keywords_cfg.get("name_include_terms", []) or []
    expansions = keywords_cfg.get("name_expansions", []) or []

    found: List[str] = []
    for term in include_terms:
        if term and term in name:
            found.append(term)
    for base in base_terms:
        if base and base in name:
            found.append(base)
            for suffix in suffix_terms:
                if suffix and suffix in name:
                    found.append(f"{base}{suffix}")
    for item in expansions:
        triggers = item.get("trigger_terms", []) or []
        additions = item.get("include_terms", []) or []
        if any(trigger in name for trigger in triggers):
            found.extend(additions)
    return list(dict.fromkeys([term for term in found if term]))


def should_exclude(keyword: str, exclude_regex: Sequence[str], exclude_pairs: Sequence[dict]) -> bool:
    for pattern in exclude_regex:
        if re.search(pattern, keyword):
            return True
    for pair in exclude_pairs:
        industry_terms = pair.get("industry_terms", [])
        modifiers = pair.get("modifiers", [])
        if any(term in keyword for term in industry_terms) and any(mod in keyword for mod in modifiers):
            return True
    return False


def pick_competition_radius(
    maps_client: NaverMapsClient,
    local_client: Optional[NaverLocalClient],
    query: str,
    longitude: float,
    latitude: float,
    config: dict,
    region_keywords: Sequence[str],
) -> int:
    search_cfg = config["search"]
    min_count = search_cfg["competition_min_count"]
    radius_km = search_cfg["radius_start_km"]
    radius_max = search_cfg["radius_max_km"]
    radius_step = search_cfg["radius_step_km"]
    use_local = search_cfg.get("use_local_api", False)
    local_region_terms = search_cfg.get("local_region_terms", 2)

    if use_local and local_client:
        local_query = build_local_query(region_keywords, query, local_region_terms)
        data = local_client.search_local(local_query, display=5)
        items = data.get("items", []) if data else []
        total = data.get("total", len(items)) if data else 0
        if total >= min_count:
            return int(radius_km)
        return int(radius_max)

    while radius_km <= radius_max:
        radius_m = int(radius_km * 1000)
        data = maps_client.search_place(query, longitude, latitude, radius_m)
        items = extract_items(data or {})
        total = extract_total(data or {}, items)
        if total >= min_count:
            return int(radius_km)
        radius_km += radius_step
    return int(radius_max)


def fetch_pois(
    maps_client: NaverMapsClient,
    local_client: Optional[NaverLocalClient],
    longitude: float,
    latitude: float,
    radius_km: int,
    queries: Sequence[str],
    config: dict,
    region_keywords: Sequence[str],
    allowed_categories: Optional[Sequence[str]] = None,
    allowed_name_keywords: Optional[Sequence[str]] = None,
) -> List[str]:
    if not config["pois"].get("enabled", True):
        return []
    names: List[str] = []
    use_local = config["pois"].get("use_local_api", False)
    local_region_terms = config["search"].get("local_region_terms", 2)
    local_display = config["pois"].get("local_display", 10)
    allowed_categories = allowed_categories or []
    allowed_name_keywords = allowed_name_keywords or []

    if use_local and local_client:
        for query in queries:
            local_query = build_local_query(region_keywords, query, local_region_terms)
            data = local_client.search_local(local_query, display=local_display)
            if not data:
                continue
            names.extend(
                extract_place_names_filtered(
                    data,
                    allowed_categories,
                    allowed_name_keywords,
                )
            )
        return list(dict.fromkeys([name for name in names if name]))

    radius_m = int(radius_km * 1000)
    for query in queries:
        data = maps_client.search_place(query, longitude, latitude, radius_m)
        if not data:
            continue
        names.extend(extract_place_names(data))
    return list(dict.fromkeys([name for name in names if name]))


def build_business_contexts(
    rows: List[dict],
    maps_client: NaverMapsClient,
    local_client: Optional[NaverLocalClient],
    config: dict,
) -> List[BusinessContext]:
    contexts: List[BusinessContext] = []
    geocode_cache: Dict[str, Optional[Tuple[float, float]]] = {}
    reverse_cache: Dict[Tuple[float, float], Optional[dict]] = {}

    for row in rows:
        name = row.get("상호명", "").strip()
        address = row.get("주소(도로명)", "").strip()
        service_text = row.get("주요서비스", "").strip()
        if not address:
            logger.warning("Missing address for %s", name or "unknown")
            continue

        if address not in geocode_cache:
            geocode_cache[address] = maps_client.geocode(address)
        coords = geocode_cache[address]
        if not coords:
            logger.warning("Geocode failed for address: %s", address)
            continue
        longitude, latitude = coords

        rev_key = (longitude, latitude)
        if rev_key not in reverse_cache:
            reverse_cache[rev_key] = maps_client.reverse_geocode(longitude, latitude)
        region_keywords = extract_region_keywords(reverse_cache[rev_key])

        services = split_terms(service_text)
        name_terms = extract_name_terms(name, config)
        services.extend(name_terms)
        services = expand_services(service_text, services, config)
        industries = derive_industries(service_text, services, config)
        competition_query = industries[0] if industries else service_text

        radius_km = pick_competition_radius(
            maps_client,
            local_client,
            competition_query,
            longitude,
            latitude,
            config,
            region_keywords,
        )

        poi_cfg = config["pois"]
        allowed_categories = poi_cfg.get("allowed_categories", {})
        allowed_names = poi_cfg.get("allowed_name_keywords", {})
        subway_pois = fetch_pois(
            maps_client,
            local_client,
            longitude,
            latitude,
            radius_km,
            poi_cfg.get("subway_queries", []),
            config,
            region_keywords,
            allowed_categories.get("subway", []),
            allowed_names.get("subway", []),
        )
        landmark_pois = fetch_pois(
            maps_client,
            local_client,
            longitude,
            latitude,
            radius_km,
            poi_cfg.get("landmark_queries", []),
            config,
            region_keywords,
            allowed_categories.get("landmark", []),
            allowed_names.get("landmark", []),
        )
        address_terms = address_tokens(address, region_keywords)
        filtered_pois = filter_pois(subway_pois + landmark_pois, address_terms)
        region_cfg = config.get("region", {})
        if region_cfg.get("include_poi", False):
            region_keywords = list(dict.fromkeys(region_keywords + filtered_pois))
        if region_cfg.get("combine_terms", False):
            suffixes = region_cfg.get("shorten_suffixes", [])
            shortened = shorten_region_terms(region_keywords, suffixes)
            combined = combine_region_terms(shortened)
            region_keywords = list(dict.fromkeys(region_keywords + shortened + combined))

        contexts.append(
            BusinessContext(
                name=name,
                address=address,
                services=services,
                industries=industries,
                region_keywords=region_keywords,
                poi_keywords=filtered_pois,
                longitude=longitude,
                latitude=latitude,
            )
        )

    return contexts


def generate_keywords(
    contexts: Sequence[BusinessContext],
    modifiers: Sequence[str],
    config: dict,
) -> Dict[str, int]:
    patterns = config["keywords"]["patterns"]
    joiner = config["keywords"].get("joiner", "")
    exclude_regex = config["filters"].get("exclude_regex", [])
    exclude_pairs = config["filters"].get("exclude_pairs", [])

    keyword_rank: Dict[str, int] = {}
    for context in contexts:
        columns = {
            "region": context.region_keywords,
            "industry": context.industries,
            "service": context.services,
            "modifier": list(modifiers),
            "poi": context.poi_keywords,
        }
        for pattern in patterns:
            parts = [columns.get(key, []) for key in pattern]
            if any(not part for part in parts):
                continue
            for combo in product(*parts):
                keyword = joiner.join(combo)
                if should_exclude(keyword, exclude_regex, exclude_pairs):
                    continue
                if keyword not in keyword_rank or keyword_rank[keyword] > len(pattern):
                    keyword_rank[keyword] = len(pattern)
    return keyword_rank


def generate_keywords_from_components(
    region_terms: Sequence[str],
    service_terms: Sequence[str],
    modifier_terms: Sequence[str],
    poi_terms: Sequence[str],
    patterns: Sequence[Sequence[str]],
    config: dict,
) -> Dict[str, int]:
    joiner = config["keywords"].get("joiner", "")
    exclude_regex = config["filters"].get("exclude_regex", [])
    exclude_pairs = config["filters"].get("exclude_pairs", [])
    columns = {
        "region": list(region_terms),
        "service": list(service_terms),
        "modifier": list(modifier_terms),
        "poi": list(poi_terms),
    }
    keyword_rank: Dict[str, int] = {}
    for pattern in patterns:
        parts = [columns.get(key, []) for key in pattern]
        if any(not part for part in parts):
            continue
        for combo in product(*parts):
            keyword = joiner.join(combo)
            if should_exclude(keyword, exclude_regex, exclude_pairs):
                continue
            if keyword not in keyword_rank or keyword_rank[keyword] > len(pattern):
                keyword_rank[keyword] = len(pattern)
    return keyword_rank


def read_csv_rows(path: Path) -> List[dict]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        return list(reader)


def read_ad_group_ids(path: Path) -> List[str]:
    rows = read_csv_rows(path)
    ids = []
    for row in rows:
        value = row.get("ad_group_id", "").strip()
        if value:
            ids.append(value)
    return ids


def write_output(
    output_dir: Path,
    ad_group_ids: Sequence[str],
    keywords: List[str],
    keywords_per_group: int,
    config: dict,
) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    output_cfg = config.get("output", {})
    encoding = output_cfg.get("encoding", "utf-8-sig")
    template = output_cfg.get("template", "")
    header_rows = output_cfg.get("header_rows", [])
    columns = output_cfg.get("columns", ["ad_group_id", "keyword"])
    default_pc_url = output_cfg.get("default_pc_url", "")
    default_mobile_url = output_cfg.get("default_mobile_url", "")
    default_bid = output_cfg.get("default_bid", "")
    for index, ad_group_id in enumerate(ad_group_ids):
        start = index * keywords_per_group
        end = start + keywords_per_group
        chunk = keywords[start:end]
        if not chunk:
            break
        output_path = output_dir / f"ad_group_{index + 1:04d}.csv"
        with output_path.open("w", encoding=encoding, newline="") as handle:
            writer = csv.writer(handle)
            if template == "naver_csv":
                for row in header_rows:
                    writer.writerow(row)
                writer.writerow(columns)
            else:
                writer.writerow(columns)
            for keyword in chunk:
                if template == "naver_csv":
                    writer.writerow(
                        [ad_group_id, keyword, default_pc_url, default_mobile_url, default_bid]
                    )
                else:
                    writer.writerow([ad_group_id, keyword])


def run_pipeline(
    input_path: Path,
    ad_groups_path: Path,
    output_dir: Path,
    config_path: Path,
    env_path: Optional[Path] = None,
    log_level: str = "INFO",
    extra_service_terms: Optional[List[str]] = None,
    allow_shortfall: bool = False,
    poi_filter_set: Optional[str] = None,
) -> dict:
    logging.basicConfig(level=log_level, format="%(levelname)s: %(message)s")

    env_file = env_path or (Path(__file__).resolve().parent / ".env")
    load_dotenv(env_file)

    maps_client_id = os.getenv("NAVER_MAPS_CLIENT_ID", "")
    maps_client_secret = os.getenv("NAVER_MAPS_CLIENT_SECRET", "")
    local_client_id = os.getenv("NAVER_LOCAL_CLIENT_ID", "")
    local_client_secret = os.getenv("NAVER_LOCAL_CLIENT_SECRET", "")

    if not maps_client_id or not maps_client_secret:
        raise SystemExit("Missing NAVER_MAPS_CLIENT_ID or NAVER_MAPS_CLIENT_SECRET in .env")

    config = load_config(config_path)
    if poi_filter_set:
        poi_cfg = config.setdefault("pois", {})
        filter_sets = poi_cfg.get("filter_sets", {})
        selected = filter_sets.get(poi_filter_set)
        if selected:
            poi_cfg["allowed_categories"] = selected.get("allowed_categories", {})
            poi_cfg["allowed_name_keywords"] = selected.get("allowed_name_keywords", {})
    if extra_service_terms:
        keywords_cfg = config.setdefault("keywords", {})
        service_terms = keywords_cfg.get("service_terms", []) or []
        service_terms = list(dict.fromkeys(service_terms + extra_service_terms))
        keywords_cfg["service_terms"] = service_terms
    delay_sec = float(config.get("api", {}).get("request_delay_sec", 0))

    maps_client = NaverMapsClient(
        maps_client_id,
        maps_client_secret,
        config["api"]["maps_base_url"],
        delay_sec,
    )

    local_client = None
    if local_client_id and local_client_secret:
        local_client = NaverLocalClient(
            local_client_id,
            local_client_secret,
            config["api"]["local_base_url"],
            delay_sec,
        )
    if (config["search"].get("use_local_api") or config["pois"].get("use_local_api")) and not local_client:
        raise SystemExit("Missing NAVER_LOCAL_CLIENT_ID or NAVER_LOCAL_CLIENT_SECRET in .env")

    input_rows = read_csv_rows(input_path)
    required_columns = {"상호명", "주소(도로명)", "주요서비스"}
    if not input_rows or not required_columns.issubset(input_rows[0].keys()):
        raise SystemExit("Input CSV must include columns: 상호명, 주소(도로명), 주요서비스")

    ad_group_ids = read_ad_group_ids(ad_groups_path)
    if not ad_group_ids:
        raise SystemExit("No ad_group_id values found in ad group CSV")

    contexts = build_business_contexts(input_rows, maps_client, local_client, config)
    if not contexts:
        raise SystemExit(
            "No valid business contexts built. Check input columns and Maps Geocoding subscription."
        )

    modifiers_tiers = config["keywords"].get("modifiers_tiers", [])
    selected_modifiers: List[str] = []
    keywords_per_group = config["output"]["keywords_per_group"]
    target_total = len(ad_group_ids) * keywords_per_group

    keyword_rank: Dict[str, int] = {}
    for tier in modifiers_tiers:
        selected_modifiers.extend(tier)
        keyword_rank = generate_keywords(contexts, selected_modifiers, config)
        if len(keyword_rank) >= target_total:
            break

    shortfall = 0
    if len(keyword_rank) < target_total:
        shortfall = target_total - len(keyword_rank)
        if not allow_shortfall:
            raise SystemExit(
                f"Not enough keywords ({len(keyword_rank)}) to fill {target_total}. "
                "Add more modifiers or loosen filters."
            )

    sorted_keywords = sorted(
        keyword_rank.items(),
        key=lambda item: (item[1], len(item[0]), item[0]),
    )
    final_keywords = [keyword for keyword, _ in sorted_keywords[:target_total]]

    write_output(output_dir, ad_group_ids, final_keywords, keywords_per_group, config)
    logger.info("Generated %s files in %s", len(ad_group_ids), output_dir)
    merged_regions = sorted({term for ctx in contexts for term in ctx.region_keywords})
    merged_services = sorted({term for ctx in contexts for term in ctx.services})
    merged_pois = sorted({term for ctx in contexts for term in ctx.poi_keywords})
    patterns = config.get("keywords", {}).get("patterns", [])
    return {
        "target_total": target_total,
        "generated_total": len(final_keywords),
        "shortfall": shortfall,
        "ad_group_ids": ad_group_ids,
        "keywords_per_group": keywords_per_group,
        "components": {
            "regions": merged_regions,
            "services": merged_services,
            "modifiers": list(dict.fromkeys(selected_modifiers)),
            "pois": merged_pois,
        },
        "patterns": patterns,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Keyword generator for Naver search ads")
    parser.add_argument("--input", required=True, help="Business input CSV")
    parser.add_argument("--ad-groups", required=True, help="Ad group CSV with ad_group_id column")
    parser.add_argument("--output-dir", required=True, help="Output directory for CSV files")
    parser.add_argument("--config", default="config.yaml", help="Config YAML path")
    parser.add_argument("--log-level", default="INFO")
    args = parser.parse_args()

    run_pipeline(
        input_path=Path(args.input),
        ad_groups_path=Path(args.ad_groups),
        output_dir=Path(args.output_dir),
        config_path=Path(args.config),
        env_path=Path(__file__).resolve().parent / ".env",
        log_level=args.log_level,
    )


if __name__ == "__main__":
    main()
