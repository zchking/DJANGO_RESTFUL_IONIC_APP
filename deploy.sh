#!/bin/bash
# Author: Wonder
# Description:
# Usage:

prog=$0;

case $1 in
    ## 上传代码(git-push)到中转仓库
    upload-to-server)
        git push server master:master;
        ;;

    ## 把代码从中转仓库合并(git-pull)到应用目录
    reload-server-app)
        ssh mama@45.56.88.200 'source ~/venvs/meets/bin/activate \
            && cd /home/mama/meets \
            && git pull deploy master \
            && touch /home/mama/meets/server/mama/wsgi.py \
            && cd server && python manage.py collectstatic --noinput'
        ;;

    full)
        $prog upload-to-server && $prog reload-server-app;
        ;;
    *)
        echo "Usage: $0 {upload-to-server|reload-server-app|full}";
        exit 0;
        ;;
esac

