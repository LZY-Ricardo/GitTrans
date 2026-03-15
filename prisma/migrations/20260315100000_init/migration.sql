-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `avatarUrl` VARCHAR(191) NULL,
    `githubLogin` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    UNIQUE INDEX `User_githubLogin_key`(`githubLogin`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GitHubAccount` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `githubUserId` VARCHAR(191) NOT NULL,
    `login` VARCHAR(191) NOT NULL,
    `encryptedAccessToken` TEXT NULL,
    `encryptedRefreshToken` TEXT NULL,
    `accessTokenExpiresAt` DATETIME(3) NULL,
    `refreshTokenExpiresAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `GitHubAccount_userId_key`(`userId`),
    UNIQUE INDEX `GitHubAccount_githubUserId_key`(`githubUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Session` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `tokenHash` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Session_tokenHash_key`(`tokenHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GitHubAppInstallation` (
    `id` VARCHAR(191) NOT NULL,
    `installationId` VARCHAR(191) NOT NULL,
    `accountLogin` VARCHAR(191) NOT NULL,
    `accountType` VARCHAR(191) NOT NULL,
    `repositoriesCount` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `GitHubAppInstallation_installationId_key`(`installationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Repository` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `installationRefId` VARCHAR(191) NOT NULL,
    `owner` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `githubRepoId` VARCHAR(191) NOT NULL,
    `defaultBranch` VARCHAR(191) NOT NULL,
    `baseBranch` VARCHAR(191) NOT NULL,
    `baseLanguage` VARCHAR(191) NOT NULL,
    `status` ENUM('ready', 'running', 'error', 'disconnected') NOT NULL DEFAULT 'ready',
    `currentPrNumber` INTEGER NULL,
    `translationBranch` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Repository_fullName_key`(`fullName`),
    UNIQUE INDEX `Repository_githubRepoId_key`(`githubRepoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RepositoryConfig` (
    `id` VARCHAR(191) NOT NULL,
    `repoId` VARCHAR(191) NOT NULL,
    `targetLanguagesJson` JSON NOT NULL,
    `includePathsJson` JSON NOT NULL,
    `ignoreRulesText` TEXT NOT NULL,
    `modelId` VARCHAR(191) NOT NULL,
    `outputRoot` VARCHAR(191) NOT NULL DEFAULT 'translations',
    `readmeNavigationEnabled` BOOLEAN NOT NULL DEFAULT true,
    `usePlatformKey` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `RepositoryConfig_repoId_key`(`repoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RepositorySyncState` (
    `id` VARCHAR(191) NOT NULL,
    `repoId` VARCHAR(191) NOT NULL,
    `lastSyncedSha` VARCHAR(191) NULL,
    `lastSuccessfulTaskId` VARCHAR(191) NULL,
    `lastWebhookDeliveryId` VARCHAR(191) NULL,
    `lastSyncedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `RepositorySyncState_repoId_key`(`repoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TranslationTask` (
    `id` VARCHAR(191) NOT NULL,
    `repoId` VARCHAR(191) NOT NULL,
    `type` ENUM('full', 'incremental') NOT NULL,
    `triggerSource` ENUM('manual', 'webhook', 'system') NOT NULL,
    `status` ENUM('pending', 'running', 'succeeded', 'failed', 'cancelled') NOT NULL DEFAULT 'pending',
    `priority` INTEGER NOT NULL DEFAULT 0,
    `payloadJson` JSON NULL,
    `progressTotal` INTEGER NOT NULL DEFAULT 0,
    `progressDone` INTEGER NOT NULL DEFAULT 0,
    `progressFailed` INTEGER NOT NULL DEFAULT 0,
    `changedFilesJson` JSON NULL,
    `targetLanguagesJson` JSON NULL,
    `modelId` VARCHAR(191) NULL,
    `currentLanguage` VARCHAR(191) NULL,
    `currentFile` VARCHAR(191) NULL,
    `readmeNavigationPreview` TEXT NULL,
    `commitRange` VARCHAR(191) NULL,
    `prUrl` VARCHAR(191) NULL,
    `errorSummary` TEXT NULL,
    `lockOwner` VARCHAR(191) NULL,
    `lockExpiresAt` DATETIME(3) NULL,
    `startedAt` DATETIME(3) NULL,
    `finishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TranslationTaskItem` (
    `id` VARCHAR(191) NOT NULL,
    `taskId` VARCHAR(191) NOT NULL,
    `language` VARCHAR(191) NOT NULL,
    `filePath` VARCHAR(191) NOT NULL,
    `outputPath` VARCHAR(191) NULL,
    `status` ENUM('pending', 'running', 'succeeded', 'failed', 'skipped') NOT NULL DEFAULT 'pending',
    `errorMessage` TEXT NULL,
    `sourceContent` LONGTEXT NULL,
    `translatedContent` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PullRequestState` (
    `id` VARCHAR(191) NOT NULL,
    `repoId` VARCHAR(191) NOT NULL,
    `number` INTEGER NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `state` VARCHAR(191) NOT NULL,
    `headBranch` VARCHAR(191) NOT NULL,
    `baseBranch` VARCHAR(191) NOT NULL,
    `lastCommitSha` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PullRequestState_repoId_key`(`repoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WebhookDelivery` (
    `id` VARCHAR(191) NOT NULL,
    `deliveryId` VARCHAR(191) NOT NULL,
    `eventName` VARCHAR(191) NOT NULL,
    `installationId` VARCHAR(191) NULL,
    `repoFullName` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL,
    `receivedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `processedAt` DATETIME(3) NULL,

    UNIQUE INDEX `WebhookDelivery_deliveryId_key`(`deliveryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `GitHubAccount` ADD CONSTRAINT `GitHubAccount_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Session` ADD CONSTRAINT `Session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Repository` ADD CONSTRAINT `Repository_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Repository` ADD CONSTRAINT `Repository_installationRefId_fkey` FOREIGN KEY (`installationRefId`) REFERENCES `GitHubAppInstallation`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RepositoryConfig` ADD CONSTRAINT `RepositoryConfig_repoId_fkey` FOREIGN KEY (`repoId`) REFERENCES `Repository`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RepositorySyncState` ADD CONSTRAINT `RepositorySyncState_repoId_fkey` FOREIGN KEY (`repoId`) REFERENCES `Repository`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TranslationTask` ADD CONSTRAINT `TranslationTask_repoId_fkey` FOREIGN KEY (`repoId`) REFERENCES `Repository`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TranslationTaskItem` ADD CONSTRAINT `TranslationTaskItem_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `TranslationTask`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PullRequestState` ADD CONSTRAINT `PullRequestState_repoId_fkey` FOREIGN KEY (`repoId`) REFERENCES `Repository`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

