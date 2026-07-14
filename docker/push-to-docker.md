1. 编译
```
mvn install
```
2. 构建镜像及推送镜像（不需要docker环境）
```
export DOCKER_REGISTRY=registry.cn-beijing.aliyuncs.com
export DOCKER_NAMESPACE=jeequan
export DOCKER_IMAGE_TAG=v1.14.0-alpha
export DOCKER_REGISTRY_USERNAME=username1
export DOCKER_REGISTRY_PASSWORD=password1

cd OpenHubs Pay-payment
mvn jib:build \
    -Djib.to.image=$DOCKER_REGISTRY/$DOCKER_NAMESPACE/OpenHubs Pay-payment:$DOCKER_IMAGE_TAG \
    -Djib.to.auth.username=$DOCKER_REGISTRY_USERNAME \
    -Djib.to.auth.password=$DOCKER_REGISTRY_PASSWORD
    
cd ../OpenHubs Pay-merchant
mvn jib:build \
    -Djib.to.image=$DOCKER_REGISTRY/$DOCKER_NAMESPACE/OpenHubs Pay-merchant:$DOCKER_IMAGE_TAG \
    -Djib.to.auth.username=$DOCKER_REGISTRY_USERNAME \
    -Djib.to.auth.password=$DOCKER_REGISTRY_PASSWORD
 
cd ../OpenHubs Pay-manager
mvn jib:build \
    -Djib.to.image=$DOCKER_REGISTRY/$DOCKER_NAMESPACE/OpenHubs Pay-manager:$DOCKER_IMAGE_TAG \
    -Djib.to.auth.username=$DOCKER_REGISTRY_USERNAME \
    -Djib.to.auth.password=$DOCKER_REGISTRY_PASSWORD
```

