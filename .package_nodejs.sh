#!/usr/bin/env bash
cvms_config_path="./c-depend.json"
package_path="./package.json"

# 依赖安装
npm install

if [ $? -eq 0 ];then
    echo "============================================="
    echo "依赖安装成功!"
    echo "============================================="
else
    echo "============================================="
    echo "依赖安装失败!"
    echo "============================================="
    exit 1;
fi

# 替换项目文件

####
#替换cvms配置文件
#replace_cvms_config
####
function replace_cvms_config(){
   echo "============================================="
   echo "环境变量$cvms_env"
   echo "============================================="
   echo "替换配置$cvms_config_path"
   echo "============================================="
   #查找环境变量并替换对应环境
   sed -i 's/"buildEnv":\w/"buildEnv":'$cvms_env'/g' $cvms_config_path
   if [ $? -eq 0 ];then
      echo "============================================="
      echo "替换配置成功!"
      echo "============================================="
   else
      echo "============================================="
      echo "替换配置失败!"
      echo "============================================="
      exit 1;
   fi
}

####
#替换package.json配置文件
#replace_package
####
function replace_package(){
   echo "替换配置$package_path"
   echo "============================================="
   #查找环境变量并替换对应环境
   sed -i 's/"build": "webpack -p"/"build": "webpack"/g' $package_path
   if [ $? -eq 0 ];then
      echo "============================================="
      echo "替换package配置成功!"
      echo "============================================="
   else
      echo "============================================="
      echo "替换package配置失败!"
      echo "============================================="
      exit 1;
   fi
}

####
#根据不同的env替换不同的环境变量
#build_cvms_config
####
function build_cvms_config(){
   case $ENV in
      # 当为开发环境时
      "dev" )
      cvms_env="1"
      replace_cvms_config
      replace_package
         ;;
      # 当为测试环境时
      "test"|t[0-9]*)
      cvms_env="2"
      replace_cvms_config
      replace_package
         ;;
      # 当为其他环境时,取线上环境
      *)
      cvms_env="6"
      replace_cvms_config
         ;;
      esac
}

build_cvms_config

# 构建项目依赖
cvms start
if [ $? -eq 0 ];then
    echo "============================================="
    echo "构建配置文件成功!"
    echo "============================================="
else
    echo "============================================="
    echo "构建配置文件失败!"
    echo "============================================="
    exit 1;
fi

# 预留的构建步骤,如果有,请在package.json中添加build script并启用
npm run build

# 生成MD5和release
echo "============================================="
echo "生成MD5和release文件!"
echo `date +%s` > ./md5
echo `date +%s` > ./release
echo "============================================="