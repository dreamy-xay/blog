@echo off

REM 复制_config 到 _config.tmp 并启用 netlify 配置，运行 npm deploy，将 _config.tmp 复制回 _config 并删除临时文件
copy /Y _config.yml _config.yml.tmp && copy /Y _config.butterfly.yml _config.butterfly.yml.tmp && copy /Y netlify_config.yml _config.yml && copy /Y netlify_config.butterfly.yml _config.butterfly.yml && npm run deploy && copy /Y _config.yml.tmp _config.yml && copy /Y _config.butterfly.yml.tmp _config.butterfly.yml && del _config.yml.tmp && del _config.butterfly.yml.tmp
