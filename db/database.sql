CREATE TABLE `conversation_table` (
  `cid` varchar(50) DEFAULT NULL,
  `user_id` varchar(40) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci

CREATE TABLE `group_table` (
  `cid` varchar(50) DEFAULT NULL,
  `group_name` varchar(45) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci

CREATE TABLE `message_table` (
  `m_id` varchar(50) NOT NULL,
  `cid` varchar(50) DEFAULT NULL,
  `sender_id` varchar(40) DEFAULT NULL,
  `data` varchar(45) DEFAULT NULL,
  `timestamp` bigint DEFAULT NULL,
  `group` int DEFAULT NULL,
  PRIMARY KEY (`m_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci

CREATE TABLE `user_table` (
  `user_id` varchar(40) NOT NULL,
  `username` varchar(45) NOT NULL,
  `position` varchar(45) DEFAULT NULL,
  `emp_id` int DEFAULT NULL,
  `domain` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username_UNIQUE` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci