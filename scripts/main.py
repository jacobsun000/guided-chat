"""Generate one Markdown brief for every research task."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any


REPOSITORY_ROOT = Path(__file__).resolve().parent.parent
TASKS_FILE = REPOSITORY_ROOT / "tasks" / "tasks.json"
TASKS_DIRECTORY = TASKS_FILE.parent
DATASETS_DIRECTORY = REPOSITORY_ROOT / "datasets"


def load_json(path: Path) -> Any:
    with path.open(encoding="utf-8") as file:
        return json.load(file)


def dataset_paths_by_id() -> dict[str, Path]:
    paths: dict[str, Path] = {}

    for metadata_path in sorted(DATASETS_DIRECTORY.glob("*/metadata.json")):
        metadata = load_json(metadata_path)
        dataset_id = metadata.get("dataset", {}).get("id")

        if not isinstance(dataset_id, str) or not dataset_id:
            raise ValueError(f"Missing dataset.id in {metadata_path}")
        if dataset_id in paths:
            raise ValueError(f"Duplicate dataset id: {dataset_id}")

        paths[dataset_id] = metadata_path.parent.relative_to(REPOSITORY_ROOT)

    return paths


def task_directory_name(task_id: str) -> str:
    safe_id = re.sub(r"[^a-zA-Z0-9._-]+", "-", task_id).strip("-.")
    if not safe_id:
        raise ValueError(f"Task id cannot be used as a directory name: {task_id!r}")
    return safe_id


def render_task(task: dict[str, Any], dataset_path: Path) -> str:
    name = task.get("name")
    content = task.get("content")
    deliverables = task.get("deliverables")

    if not isinstance(name, str) or not name:
        raise ValueError(f"Task {task.get('id')!r} has no name")
    if not isinstance(content, str) or not content:
        raise ValueError(f"Task {task.get('id')!r} has no content")
    if not isinstance(deliverables, str) or not deliverables:
        raise ValueError(f"Task {task.get('id')!r} has no deliverables")

    return (
        f"# {name}\n\n"
        f"## Content\n\n{content}\n\n"
        f"## Deliverables\n\n{deliverables}\n\n"
        f"## Dataset path\n\n`{dataset_path.as_posix()}`\n"
    )


def main() -> None:
    task_document = load_json(TASKS_FILE)
    tasks = task_document.get("tasks")
    if not isinstance(tasks, list):
        raise ValueError(f"Expected a tasks list in {TASKS_FILE}")

    dataset_paths = dataset_paths_by_id()
    generated_files: list[Path] = []
    directory_names: set[str] = set()

    for task in tasks:
        if not isinstance(task, dict):
            raise ValueError("Every task must be a JSON object")

        task_id = task.get("id")
        dataset_id = task.get("dataset")
        if not isinstance(task_id, str) or not task_id:
            raise ValueError("Every task must have a non-empty string id")
        if not isinstance(dataset_id, str) or not dataset_id:
            raise ValueError(f"Task {task_id!r} has no dataset id")
        if dataset_id not in dataset_paths:
            raise ValueError(
                f"Task {task_id!r} refers to unknown dataset {dataset_id!r}"
            )

        directory_name = task_directory_name(task_id)
        if directory_name in directory_names:
            raise ValueError(f"Duplicate task output directory: {directory_name}")
        directory_names.add(directory_name)

        output_directory = TASKS_DIRECTORY / directory_name
        output_directory.mkdir(exist_ok=True)
        output_path = output_directory / "task.md"
        output_path.write_text(
            render_task(task, dataset_paths[dataset_id]), encoding="utf-8"
        )
        generated_files.append(output_path)

        # Clean up output created by the previous flat directory layout.
        (TASKS_DIRECTORY / f"{directory_name}.md").unlink(missing_ok=True)

    print(f"Generated {len(generated_files)} task files in {TASKS_DIRECTORY}")


if __name__ == "__main__":
    main()
