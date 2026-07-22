FROM python:3.13-slim-bookworm@sha256:dd86541a59b252667f4c12f8b2ee17216de37dd65ac773bf097bef996fa78860

RUN apt-get update && apt-get install -y --no-install-recommends bash coreutils procps util-linux git curl ca-certificates jq ripgrep \
  && rm -rf /var/lib/apt/lists/* \
  && python -m venv /opt/venv
COPY requirements.txt /tmp/requirements.txt
RUN /opt/venv/bin/pip install --no-cache-dir --requirement /tmp/requirements.txt && rm /tmp/requirements.txt
COPY apply_patch.py /opt/guided-chat/apply_patch
RUN chmod 0555 /opt/guided-chat/apply_patch \
  && groupadd --gid 10001 sandbox \
  && useradd --uid 10001 --gid 10001 --no-create-home --home-dir /workspace/.home sandbox
ENV PATH="/opt/venv/bin:${PATH}" PYTHONDONTWRITEBYTECODE=1 HOME=/workspace/.home
USER 10001:10001
WORKDIR /workspace
CMD ["sleep", "infinity"]
