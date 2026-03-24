#!/usr/bin/env bash
# publish.sh — 发布所有包到 GitHub Packages
# 自动替换 workspace:* 为实际版本号，发布后恢复
#
# 用法: GITHUB_TOKEN=ghp_xxx ./scripts/publish.sh

set -e

if [ -z "$GITHUB_TOKEN" ]; then
  echo "错误: 请设置 GITHUB_TOKEN 环境变量"
  echo "用法: GITHUB_TOKEN=ghp_xxx ./scripts/publish.sh"
  exit 1
fi

cd "$(dirname "$0")/.."

# 获取当前 core 版本
CORE_VERSION=$(node -p "require('./packages/core/package.json').version")
UI_VERSION=$(node -p "require('./packages/ui/package.json').version")
echo "发布版本: core=$CORE_VERSION ui=$UI_VERSION"

# 替换 workspace:* 为实际版本
echo "替换 workspace:* 依赖..."
for pkg in packages/engine packages/ui packages/game-ui; do
  if [ -f "$pkg/package.json" ]; then
    sed -i.bak "s/\"workspace:\\*\"/\"^$CORE_VERSION\"/g" "$pkg/package.json"
  fi
done
# game-ui 还依赖 ui
sed -i.bak "s/\"\\^$CORE_VERSION\"/\"^$UI_VERSION\"/2" packages/game-ui/package.json 2>/dev/null || true

# 设置 token
echo "//npm.pkg.github.com/:_authToken=$GITHUB_TOKEN" > ~/.npmrc.github

# 按依赖顺序发布
PUBLISH_ORDER="core physics systems ui engine game-ui"
for pkg in $PUBLISH_ORDER; do
  echo "发布 @lucid-2d/$pkg..."
  cd "packages/$pkg"
  npm publish --userconfig ~/.npmrc.github 2>&1 | tail -1
  cd ../..
done

# 清除 token
echo "//npm.pkg.github.com/:_authToken=DELETED" > ~/.npmrc.github

# 恢复 workspace:* 依赖
echo "恢复 workspace:* 依赖..."
for pkg in packages/engine packages/ui packages/game-ui; do
  if [ -f "$pkg/package.json.bak" ]; then
    mv "$pkg/package.json.bak" "$pkg/package.json"
  fi
done

echo "发布完成!"
