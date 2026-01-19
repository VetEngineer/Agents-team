import csv
import io
import tempfile
import time
import uuid
import zipfile
from pathlib import Path
from typing import List, Optional

from fastapi import BackgroundTasks, FastAPI, File, Form, Request, UploadFile
from fastapi.responses import FileResponse, HTMLResponse, StreamingResponse
from fastapi.templating import Jinja2Templates

from main import generate_keywords_from_components, load_config, run_pipeline, write_output


BASE_DIR = Path(__file__).resolve().parent
TEMPLATES = Jinja2Templates(directory=str(BASE_DIR / "templates"))

app = FastAPI()
CACHE = {}


def parse_extra_terms(upload: Optional[UploadFile]) -> List[str]:
    if not upload:
        return []
    raw = upload.file.read()
    for encoding in ("utf-8-sig", "cp949"):
        try:
            text = raw.decode(encoding)
            break
        except UnicodeDecodeError:
            continue
    else:
        text = raw.decode("utf-8", errors="ignore")
    reader = csv.reader(io.StringIO(text))
    terms: List[str] = []
    for row in reader:
        for cell in row:
            value = cell.strip()
            if value and value.lower() not in ("term", "service", "keyword"):
                terms.append(value)
    return list(dict.fromkeys(terms))


def parse_lines(text: str) -> List[str]:
    terms: List[str] = []
    for raw in (text or "").splitlines():
        value = raw.strip()
        if not value:
            continue
        parts = [part.strip() for part in value.split(",") if part.strip()]
        if parts:
            terms.extend(parts)
        else:
            terms.append(value)
    return list(dict.fromkeys(terms))


def parse_pattern_values(values: List[str]) -> List[List[str]]:
    patterns: List[List[str]] = []
    for raw in values:
        value = (raw or "").strip().lower()
        if not value:
            continue
        value = value.replace("+", ",")
        parts = [part.strip() for part in value.split(",") if part.strip()]
        if parts:
            patterns.append(parts)
    return patterns


def parse_pattern_text(text: str) -> List[List[str]]:
    if not text:
        return []
    raw_lines = text.splitlines()
    return parse_pattern_values(raw_lines)


def build_preview(output_dir: Path, config: dict, limit: int = 100) -> List[str]:
    output_cfg = config.get("output", {})
    encoding = output_cfg.get("encoding", "utf-8-sig")
    header_rows = output_cfg.get("header_rows", [])
    template = output_cfg.get("template", "")
    skip_rows = len(header_rows) + 1 if template == "naver_csv" else 1
    preview: List[str] = []
    for csv_path in sorted(output_dir.glob("*.csv")):
        with csv_path.open("r", encoding=encoding, newline="") as handle:
            reader = csv.reader(handle)
            for row_index, row in enumerate(reader):
                if row_index < skip_rows:
                    continue
                if len(row) < 2:
                    continue
                keyword = row[1].strip()
                if keyword:
                    preview.append(keyword)
                if len(preview) >= limit:
                    return preview
    return preview


def store_zip(buffer: io.BytesIO) -> str:
    token = uuid.uuid4().hex
    path = Path(tempfile.gettempdir()) / f"keyword_export_{token}.zip"
    path.write_bytes(buffer.getvalue())
    CACHE[token] = {"path": path, "created": time.time()}
    return token


@app.get("/", response_class=HTMLResponse)
def index(request: Request) -> HTMLResponse:
    return TEMPLATES.TemplateResponse("index.html", {"request": request})


@app.post("/generate")
def generate(
    request: Request,
    input_csv: UploadFile = File(...),
    ad_groups_csv: UploadFile = File(...),
    extra_terms_csv: UploadFile | None = File(None),
    output_name: str = Form("keyword_exports"),
    poi_filter_set: str = Form("default"),
):
    with tempfile.TemporaryDirectory() as tmp_dir:
        tmp_path = Path(tmp_dir)
        input_path = tmp_path / "input.csv"
        ad_groups_path = tmp_path / "ad_groups.csv"
        output_dir = tmp_path / "output"
        config_path = BASE_DIR / "config.yaml"

        input_path.write_bytes(input_csv.file.read())
        ad_groups_path.write_bytes(ad_groups_csv.file.read())

        extra_terms = parse_extra_terms(extra_terms_csv)
        try:
            result = run_pipeline(
                input_path=input_path,
                ad_groups_path=ad_groups_path,
                output_dir=output_dir,
                config_path=config_path,
                env_path=BASE_DIR / ".env",
                log_level="INFO",
                extra_service_terms=extra_terms,
                allow_shortfall=True,
                poi_filter_set=poi_filter_set,
            )
        except SystemExit as exc:
            return TEMPLATES.TemplateResponse(
                "index.html",
                {"request": request, "error": str(exc)},
                status_code=400,
            )
        except Exception as exc:  # noqa: BLE001
            return TEMPLATES.TemplateResponse(
                "index.html",
                {"request": request, "error": f"처리 중 오류가 발생했습니다: {exc}"},
                status_code=500,
            )

        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
            for csv_path in sorted(output_dir.glob("*.csv")):
                zip_file.write(csv_path, arcname=csv_path.name)
        zip_buffer.seek(0)
        token = store_zip(zip_buffer)
        CACHE[token].update(
            {
                "ad_group_ids": result.get("ad_group_ids", []),
                "keywords_per_group": result.get("keywords_per_group", 1000),
                "output_name": output_name,
                "poi_filter_set": poi_filter_set,
            }
        )
        config = load_config(config_path)
        preview = build_preview(output_dir, config, limit=100)
        shortfall = result.get("shortfall", 0)
        warning = None
        if shortfall > 0:
            warning = (
                f"키워드가 부족합니다. 생성 {result.get('generated_total')}개 / "
                f"필요 {result.get('target_total')}개"
            )
        components = result.get("components", {})
        patterns = result.get("patterns", [])
        config = load_config(config_path)
        pattern_options = config.get("keywords", {}).get("patterns", [])
        pattern_values = [",".join(p) for p in pattern_options]
        selected_values = {",".join(p) for p in patterns}
        poi_filter_sets = list((config.get("pois", {}).get("filter_sets") or {}).keys())
        return TEMPLATES.TemplateResponse(
            "index.html",
            {
                "request": request,
                "preview": preview,
                "download_url": f"/download/{token}",
                "output_name": output_name,
                "warning": warning,
                "token": token,
                "regions_text": "\n".join(components.get("regions", [])),
                "services_text": "\n".join(components.get("services", [])),
                "modifiers_text": "\n".join(components.get("modifiers", [])),
                "pois_text": "\n".join(components.get("pois", [])),
                "pattern_options": pattern_values,
                "selected_patterns": selected_values,
                "patterns_custom_text": "",
                "poi_filter_sets": poi_filter_sets,
                "poi_filter_set": poi_filter_set,
            },
        )


@app.get("/download/{token}")
def download(token: str, background_tasks: BackgroundTasks):
    entry = CACHE.get(token)
    if not entry:
        return HTMLResponse("다운로드 링크가 만료되었습니다.", status_code=404)
    path = entry["path"]
    if not path.exists():
        return HTMLResponse("다운로드 파일을 찾을 수 없습니다.", status_code=404)

    def cleanup() -> None:
        try:
            path.unlink(missing_ok=True)
        finally:
            CACHE.pop(token, None)

    background_tasks.add_task(cleanup)
    return FileResponse(path=path, filename=path.name, media_type="application/zip")


@app.post("/regenerate")
def regenerate(
    request: Request,
    token: str = Form(...),
    regions: str = Form(""),
    services: str = Form(""),
    modifiers: str = Form(""),
    pois: str = Form(""),
    patterns: List[str] = Form([]),
    patterns_custom: str = Form(""),
):
    entry = CACHE.get(token)
    if not entry:
        return TEMPLATES.TemplateResponse(
            "index.html",
            {"request": request, "error": "세션이 만료되었습니다. 다시 생성해주세요."},
            status_code=400,
        )

    config_path = BASE_DIR / "config.yaml"
    config = load_config(config_path)
    region_terms = parse_lines(regions)
    service_terms = parse_lines(services)
    modifier_terms = parse_lines(modifiers)
    poi_terms = parse_lines(pois)
    pattern_list = parse_pattern_values(patterns) + parse_pattern_text(patterns_custom)
    pattern_options = config.get("keywords", {}).get("patterns", [])
    if not pattern_list:
        pattern_list = pattern_options
    selected_values = {",".join(p) for p in pattern_list}

    keyword_rank = generate_keywords_from_components(
        region_terms,
        service_terms,
        modifier_terms,
        poi_terms,
        pattern_list,
        config,
    )

    ad_group_ids = entry.get("ad_group_ids", [])
    keywords_per_group = entry.get("keywords_per_group", 1000)
    target_total = len(ad_group_ids) * keywords_per_group

    sorted_keywords = sorted(
        keyword_rank.items(),
        key=lambda item: (item[1], len(item[0]), item[0]),
    )
    final_keywords = [keyword for keyword, _ in sorted_keywords[:target_total]]
    shortfall = max(0, target_total - len(final_keywords))

    with tempfile.TemporaryDirectory() as tmp_dir:
        tmp_path = Path(tmp_dir)
        output_dir = tmp_path / "output"
        write_output(output_dir, ad_group_ids, final_keywords, keywords_per_group, config)

        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
            for csv_path in sorted(output_dir.glob("*.csv")):
                zip_file.write(csv_path, arcname=csv_path.name)
        zip_buffer.seek(0)
        new_token = store_zip(zip_buffer)
        preview = build_preview(output_dir, config, limit=100)

    warning = None
    if shortfall > 0:
        warning = f"키워드가 부족합니다. 생성 {len(final_keywords)}개 / 필요 {target_total}개"

    return TEMPLATES.TemplateResponse(
        "index.html",
        {
            "request": request,
            "preview": preview,
            "download_url": f"/download/{new_token}",
            "output_name": entry.get("output_name", "keyword_exports"),
            "warning": warning,
            "token": new_token,
            "regions_text": "\n".join(region_terms),
            "services_text": "\n".join(service_terms),
            "modifiers_text": "\n".join(modifier_terms),
            "pois_text": "\n".join(poi_terms),
            "pattern_options": [",".join(p) for p in pattern_options],
            "selected_patterns": selected_values,
            "patterns_custom_text": patterns_custom.strip(),
            "poi_filter_sets": list((config.get("pois", {}).get("filter_sets") or {}).keys()),
            "poi_filter_set": entry.get("poi_filter_set", "default"),
        },
    )
