#!/bin/bash

# config modify
# hexo config url https://blog-dreamy.netlify.app
# hexo config /
# hexo config deploy.branch gh-pages-netlify
# hexo config footer.custom_text 'Hi, welcome to my <a href="https://blog-dreamy.netlify.app">blog</a>!'
# hexo config inject.head '[<link rel="stylesheet" href="/blog/css/custom.css">, <link rel="stylesheet" href="/css/background.css">]'
# hexo config inject.bottom '[<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/animejs@3.2.1/lib/anime.min.js"></script>, <script type="text/javascript" src="/js/fireworks.min.js"></script>]'

# 复制_config 到 _config.tmp 并启用 netlify 配置
cp -f _config.yml _config.yml.tmp
cp -f _config.butterfly.yml _config.butterfly.yml.tmp
cp -f netlify_config.yml _config.yml
cp -f netlify_config.butterfly.yml _config.butterfly.yml

# 运行 npm deploy
(npm run deploy)

# 将 _config.tmp 复制回 _config 并删除临时文件
cp -f _config.yml.tmp _config.yml
cp -f _config.butterfly.yml.tmp _config.butterfly.yml
rm _config.yml.tmp
rm _config.butterfly.yml.tmp