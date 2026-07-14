# Task brief generator

Generate one `tasks/<task-id>/task.md` brief for every entry in
`tasks/tasks.json`:

```bash
uv run main.py
```

The generator resolves each task's dataset ID through the corresponding
`datasets/*/metadata.json` file.
