-- MySQL dump 10.13  Distrib 8.0.36, for Win64 (x86_64)
--
-- Host: sh-cynosdbmysql-grp-hzs4wqd2.sql.tencentcdb.com    Database: ccops
-- ------------------------------------------------------
-- Server version	8.0.22-cynos

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '62fb5ac4-1d6c-11ef-baab-b8cef61596c6:1-1218785';

--
-- Table structure for table `configurations`
--

DROP TABLE IF EXISTS `configurations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `configurations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'id',
  `created_at` datetime(3) DEFAULT NULL COMMENT '创建时间',
  `updated_at` datetime(3) DEFAULT NULL COMMENT '更新时间',
  `type` varchar(128) DEFAULT NULL,
  `field_name` varchar(128) DEFAULT NULL,
  `field_value` text,
  `field_description` text,
  `is_changed` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否更改过',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=79 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `disk_models`
--

DROP TABLE IF EXISTS `disk_models`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `disk_models` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'id',
  `created_at` datetime(3) DEFAULT NULL COMMENT '创建时间',
  `updated_at` datetime(3) DEFAULT NULL COMMENT '更新时间',
  `host_id` bigint unsigned DEFAULT NULL COMMENT '主机ID',
  `disk_space_available` double DEFAULT NULL COMMENT '磁盘剩余',
  `total_disk_space` double DEFAULT NULL COMMENT '主机总容量',
  `percent_disk_space_available` longtext COLLATE utf8mb4_general_ci COMMENT '主机磁盘使用率',
  `encrypted` tinyint(1) DEFAULT NULL COMMENT '磁盘是否加密',
  PRIMARY KEY (`id`),
  KEY `idx_disk_models_host_id` (`host_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `file_data_models`
--

DROP TABLE IF EXISTS `file_data_models`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `file_data_models` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'id',
  `created_at` datetime(3) DEFAULT NULL COMMENT '创建时间',
  `updated_at` datetime(3) DEFAULT NULL COMMENT '更新时间',
  `file_id` bigint unsigned DEFAULT NULL COMMENT '文件id',
  `data` mediumblob,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `file_models`
--

DROP TABLE IF EXISTS `file_models`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `file_models` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'id',
  `created_at` datetime(3) DEFAULT NULL COMMENT '创建时间',
  `updated_at` datetime(3) DEFAULT NULL COMMENT '更新时间',
  `file_name` varchar(128) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '文件名',
  `file_md5` varchar(32) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '文件md5',
  `description` text COLLATE utf8mb4_general_ci,
  `file_data_id` bigint unsigned DEFAULT NULL COMMENT '文件数据id',
  `file_size` bigint DEFAULT NULL COMMENT '文件大小（字节）',
  `is_binary_file` bigint DEFAULT NULL COMMENT '是否是二进制文件',
  `tags` longtext COLLATE utf8mb4_general_ci,
  `s3_bucket_name` varchar(128) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'S3存储桶名称',
  `s3_object_key` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'S3对象键',
  `download_url` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '文件下载链接',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `host_labels`
--

DROP TABLE IF EXISTS `host_labels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `host_labels` (
  `host_model_id` bigint unsigned NOT NULL,
  `label_model_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`host_model_id`,`label_model_id`),
  KEY `fk_host_labels_label_model` (`label_model_id`),
  CONSTRAINT `fk_host_labels_host_model` FOREIGN KEY (`host_model_id`) REFERENCES `host_models` (`id`),
  CONSTRAINT `fk_host_labels_label_model` FOREIGN KEY (`label_model_id`) REFERENCES `label_models` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `host_models`
--

DROP TABLE IF EXISTS `host_models`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `host_models` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'id',
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `name` varchar(36) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '主机名称',
  `operating_system` varchar(36) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '主机操作系统',
  `status` bigint DEFAULT NULL COMMENT '主机状态',
  `fetch_time` datetime(3) DEFAULT NULL COMMENT '主机抓取时间',
  `start_time` datetime(3) DEFAULT NULL COMMENT '主机启动时间',
  `agent` varchar(36) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '主机agent',
  `host_server_url` varchar(128) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '主机服务地址',
  `osquery_host_id` varchar(256) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'os的id',
  `osquery_version` varchar(64) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'os的版本',
  `platform_like` varchar(64) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '平台类型',
  `cpu_type` varchar(64) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'cpu类型',
  `cpu_microcode` varchar(64) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'cpu微码',
  `primary_ip` varchar(64) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '主ip',
  `primary_mac` varchar(64) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '主mac',
  `board_model` varchar(64) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '主板型号',
  `board_serial` varchar(64) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '主板序列号',
  `board_vendor` varchar(64) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '主板供应商',
  `board_version` varchar(64) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '主板版本',
  `cpu_logical_cores` varchar(64) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '逻辑核心数',
  `cpu_physical_cores` varchar(64) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '物理核心数',
  `cpu_sockets` varchar(64) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'cpu插槽数',
  `cpu_subtype` varchar(64) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'cpu子类型',
  `cpu_brand` varchar(64) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'cpu品牌',
  `hardware_model` varchar(64) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '硬件型号',
  `hardware_serial` varchar(64) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '硬件序列号',
  `hardware_vendor` varchar(64) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '硬件供应商',
  `hardware_version` varchar(64) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '硬件版本',
  `physical_memory` varchar(64) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '物理内存',
  `uuid` varchar(64) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '唯一标识符',
  `total_uptime_seconds` varchar(64) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '总运行秒数',
  `arch` varchar(64) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '架构类型',
  `build` varchar(64) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '操作系统构建版本',
  `kernel_version` varchar(64) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '内核版本',
  `major` varchar(64) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '操作系统主版本号',
  `minor` varchar(64) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '操作系统次版本号',
  `patch` varchar(64) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '��丁版本号',
  `platform` varchar(64) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '平台名称',
  `version` varchar(64) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '完整版本号',
  `host_user` json DEFAULT NULL COMMENT '主机用户列表',
  `software` json DEFAULT NULL COMMENT '主机软件列表',
  `disk` json DEFAULT NULL COMMENT '主机磁盘列表',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `host_user_models`
--

DROP TABLE IF EXISTS `host_user_models`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `host_user_models` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'id',
  `created_at` datetime(3) DEFAULT NULL COMMENT '创建时间',
  `updated_at` datetime(3) DEFAULT NULL COMMENT '更新时间',
  `host_id` bigint unsigned DEFAULT NULL COMMENT '主机ID',
  `user_name` longtext COLLATE utf8mb4_general_ci,
  `group_name` longtext COLLATE utf8mb4_general_ci,
  `shell` longtext COLLATE utf8mb4_general_ci,
  PRIMARY KEY (`id`),
  KEY `idx_host_user_models_host_id` (`host_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `key_models`
--

DROP TABLE IF EXISTS `key_models`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `key_models` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'id',
  `created_at` datetime(3) DEFAULT NULL COMMENT '创建时间',
  `updated_at` datetime(3) DEFAULT NULL COMMENT '更新时间',
  `public_key` text COLLATE utf8mb4_general_ci COMMENT '公钥',
  `private_key` text COLLATE utf8mb4_general_ci COMMENT '私钥',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `label_models`
--

DROP TABLE IF EXISTS `label_models`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `label_models` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'id',
  `created_at` datetime(3) DEFAULT NULL COMMENT '创建时间',
  `updated_at` datetime(3) DEFAULT NULL COMMENT '更新时间',
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL COMMENT '标签名称',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=55 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `revision_files`
--

DROP TABLE IF EXISTS `revision_files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `revision_files` (
  `role_revision_model_id` bigint unsigned NOT NULL,
  `file_model_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`role_revision_model_id`,`file_model_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `role_models`
--

DROP TABLE IF EXISTS `role_models`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_models` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'id',
  `created_at` datetime(3) DEFAULT NULL COMMENT '创建时间',
  `updated_at` datetime(3) DEFAULT NULL COMMENT '更新时间',
  `name` varchar(128) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '配置名称',
  `description` text COLLATE utf8mb4_general_ci COMMENT '配置描述',
  `tags` json DEFAULT NULL COMMENT '配置标签',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `role_revision_models`
--

DROP TABLE IF EXISTS `role_revision_models`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_revision_models` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'id',
  `created_at` datetime(3) DEFAULT NULL COMMENT '创建时间',
  `updated_at` datetime(3) DEFAULT NULL COMMENT '更新时间',
  `role_id` bigint unsigned NOT NULL COMMENT '关联的配置ID',
  `task_content` text COLLATE utf8mb4_general_ci COMMENT '任务内容',
  `handler_content` text COLLATE utf8mb4_general_ci COMMENT '处理内容',
  `var_content` text COLLATE utf8mb4_general_ci COMMENT '变量内容',
  `is_active` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否激活',
  `is_release` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否锁定',
  `release_time` datetime(3) DEFAULT NULL COMMENT '锁定时间',
  `change_log` text COLLATE utf8mb4_general_ci COMMENT '变更日志',
  PRIMARY KEY (`id`),
  KEY `idx_role_revision_models_role_id` (`role_id`)
) ENGINE=InnoDB AUTO_INCREMENT=67 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `software_models`
--

DROP TABLE IF EXISTS `software_models`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `software_models` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'id',
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `host_id` bigint unsigned DEFAULT NULL COMMENT '主机ID',
  `name` longtext COLLATE utf8mb4_general_ci,
  `version` longtext COLLATE utf8mb4_general_ci,
  `type` longtext COLLATE utf8mb4_general_ci,
  `deleted_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_software_models_host_id` (`host_id`),
  KEY `idx_software_models_deleted_at` (`deleted_at`)
) ENGINE=InnoDB AUTO_INCREMENT=3624 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `system_user_models`
--

DROP TABLE IF EXISTS `system_user_models`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_user_models` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `host_id` bigint unsigned DEFAULT NULL,
  `uid` longtext,
  `username` longtext,
  `g_id` longtext,
  `description` longtext,
  `directory` longtext,
  `shell` longtext,
  PRIMARY KEY (`id`),
  KEY `idx_system_user_models_deleted_at` (`deleted_at`),
  KEY `idx_system_user_models_host_id` (`host_id`)
) ENGINE=InnoDB AUTO_INCREMENT=142 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `target_association_models`
--

DROP TABLE IF EXISTS `target_association_models`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `target_association_models` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'id',
  `created_at` datetime(3) DEFAULT NULL COMMENT '创建时间',
  `updated_at` datetime(3) DEFAULT NULL COMMENT '更新时间',
  `task_id` bigint unsigned NOT NULL COMMENT '任务ID',
  `host_ip` varchar(128) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '目标IP',
  PRIMARY KEY (`id`),
  KEY `idx_target_association_models_task_id` (`task_id`)
) ENGINE=InnoDB AUTO_INCREMENT=743 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `task_association_models`
--

DROP TABLE IF EXISTS `task_association_models`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_association_models` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'id',
  `created_at` datetime(3) DEFAULT NULL COMMENT '创建时间',
  `updated_at` datetime(3) DEFAULT NULL COMMENT '更新时间',
  `task_id` bigint unsigned NOT NULL COMMENT '任务ID',
  `role_id` bigint unsigned NOT NULL COMMENT '发布的配置ID',
  `revision_id` bigint unsigned NOT NULL COMMENT '配置版本ID',
  `user_id` int unsigned DEFAULT NULL COMMENT '发布人id',
  `var_content` json DEFAULT NULL COMMENT '''kvs''',
  PRIMARY KEY (`id`),
  KEY `idx_task_association_models_task_id` (`task_id`),
  KEY `idx_task_association_models_role_id` (`role_id`),
  KEY `idx_task_association_models_revision_id` (`revision_id`),
  KEY `idx_task_association_models_user_id` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=749 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `task_models`
--

DROP TABLE IF EXISTS `task_models`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_models` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'id',
  `created_at` datetime(3) DEFAULT NULL COMMENT '创建时间',
  `updated_at` datetime(3) DEFAULT NULL COMMENT '更新时间',
  `task_name` varchar(128) DEFAULT NULL COMMENT '任务名',
  `user_id` int unsigned DEFAULT NULL COMMENT '发布人id',
  `status` varchar(128) DEFAULT 'created' COMMENT '任务状态',
  `type` varchar(128) DEFAULT NULL COMMENT '任务分类',
  `result` text COMMENT '任务结果',
  `shortcut_script_content` text COMMENT '快捷脚本',
  `role_details` json DEFAULT NULL COMMENT '''任务软件相关信息''',
  PRIMARY KEY (`id`),
  KEY `idx_task_models_user_id` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=706 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_key_models`
--

DROP TABLE IF EXISTS `user_key_models`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_key_models` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `host_id` bigint unsigned DEFAULT NULL COMMENT '主机ID',
  `username` varchar(191) DEFAULT NULL COMMENT '用户名',
  `key` text COMMENT 'SSH公钥',
  `comment` varchar(255) DEFAULT NULL COMMENT '公钥注释',
  `algorithm` varchar(32) DEFAULT NULL COMMENT '加密算法',
  PRIMARY KEY (`id`),
  KEY `idx_user_key_models_deleted_at` (`deleted_at`),
  KEY `idx_user_key_models_host_id` (`host_id`),
  KEY `idx_user_key_models_username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_models`
--

DROP TABLE IF EXISTS `user_models`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_models` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'id',
  `created_at` datetime(3) DEFAULT NULL COMMENT '创建时间',
  `updated_at` datetime(3) DEFAULT NULL COMMENT '更新时间',
  `nick_name` varchar(36) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '昵称',
  `username` varchar(36) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '用户名',
  `password` varchar(128) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '密码',
  `role` tinyint DEFAULT '1' COMMENT '权限，1管理员，2普通用户，3游客',
  `is_init` tinyint DEFAULT '0' COMMENT '是否初始化，0未初始化，1已初始化',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*!40101 SET character_set_client = @saved_cs_client */;

-- 插入初始管理员用户
INSERT INTO `user_models` VALUES (1,'2024-12-18 15:21:50.000','2024-12-18 15:21:50.000','注册用户','admin','$2a$04$iSKnu.OzNC8.T7aJEcTBX.96wCjj8p57f2MKjTEyHbMkzNNToLAP6',1,0);

SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-12-18 15:21:50
