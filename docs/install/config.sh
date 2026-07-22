#! /bin/sh
#exec 2>>build.log  ##编译过程打印到日志文件中
## 配置文件   .Power by terrfly

# 【项目根目录的地址】 该地址下会包含： nginx/mysql/mq/redis等文件
rootDir="/openhubshomes"

# 【mysql密码】必须由部署环境提供，禁止在仓库中保存默认密码
: "${MYSQL_ROOT_PASSWORD:?MYSQL_ROOT_PASSWORD must be set}"
mysql_pwd="$MYSQL_ROOT_PASSWORD"


#当前路径， 不要更改参数。
currentPath=`pwd`













