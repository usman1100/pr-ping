#!/bin/sh
set -eu

REPO="usman1100/pr-ping"
VERSION="${1:-latest}"
INSTALL_DIR="${PR_PING_INSTALL_DIR:-/usr/local/bin}"

if [ "$VERSION" = "latest" ]; then
  VERSION=$(curl -fsSL "https://api.github.com/repos/$REPO/releases/latest" |
    grep '"tag_name"' | sed 's/.*"tag_name": "\(.*\)",.*/\1/')
fi

DOWNLOAD_URL="https://github.com/$REPO/releases/download/$VERSION"

detect_os_arch() {
  os=$(uname -s | tr '[:upper:]' '[:lower:]')
  arch=$(uname -m)

  case "$os" in
    darwin) os="darwin" ;;
    linux)  os="linux"   ;;
    *)      echo "Unsupported OS: $os"; exit 1 ;;
  esac

  case "$arch" in
    x86_64|amd64) arch="x64"   ;;
    aarch64|arm64) arch="arm64" ;;
    *)            echo "Unsupported architecture: $arch"; exit 1 ;;
  esac

  echo "${os}-${arch}"
}

target=$(detect_os_arch)
archive="pr-ping-${VERSION}-${target}.tar.gz"

tmpdir=$(mktemp -d)
cleanup() { rm -rf "$tmpdir"; }
trap cleanup EXIT

echo "Downloading pr-ping ${VERSION} for ${target}..."

if command -v curl >/dev/null 2>&1; then
  curl -fsSL "$DOWNLOAD_URL/$archive" -o "$tmpdir/$archive"
elif command -v wget >/dev/null 2>&1; then
  wget -q "$DOWNLOAD_URL/$archive" -O "$tmpdir/$archive"
else
  echo "neither curl nor wget found"; exit 1
fi

tar xzf "$tmpdir/$archive" -C "$tmpdir"

bin_name="pr-ping-${target}"
cp "$tmpdir/$bin_name" "$INSTALL_DIR/pr-ping"
chmod +x "$INSTALL_DIR/pr-ping"

echo "pr-ping ${VERSION} installed to $INSTALL_DIR/pr-ping"
echo "Make sure $INSTALL_DIR is in your \$PATH."
