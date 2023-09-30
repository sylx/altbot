'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const { Migration } = require('@mikro-orm/migrations');

class Migration20230930114910 extends Migration {

  async up() {
    this.addSql('PRAGMA foreign_keys = OFF;');
    this.addSql('CREATE TABLE `_knex_temp_alter357` (`key` text NOT NULL, `created_at` datetime NOT NULL, `updated_at` datetime NOT NULL, `value` text NOT NULL DEFAULT \'\', PRIMARY KEY (`key`));');
    this.addSql('INSERT INTO "_knex_temp_alter357" SELECT * FROM "data";;');
    this.addSql('DROP TABLE "data";');
    this.addSql('ALTER TABLE "_knex_temp_alter357" RENAME TO "data";');
    this.addSql('PRAGMA foreign_keys = ON;');

    this.addSql('PRAGMA foreign_keys = OFF;');
    this.addSql('CREATE TABLE `_knex_temp_alter339` (`id` text NOT NULL, `created_at` datetime NOT NULL, `updated_at` datetime NOT NULL, `prefix` text NULL, `deleted` integer NOT NULL DEFAULT false, `last_interact` datetime NOT NULL, PRIMARY KEY (`id`));');
    this.addSql('INSERT INTO "_knex_temp_alter339" SELECT * FROM "guild";;');
    this.addSql('DROP TABLE "guild";');
    this.addSql('ALTER TABLE "_knex_temp_alter339" RENAME TO "guild";');
    this.addSql('PRAGMA foreign_keys = ON;');

    this.addSql('PRAGMA foreign_keys = OFF;');
    this.addSql('CREATE TABLE `_knex_temp_alter911` (`id` text NOT NULL, `edit_code` text NOT NULL, `lifetime` integer NOT NULL DEFAULT -1, `created_at` datetime NOT NULL, PRIMARY KEY (`id`));');
    this.addSql('INSERT INTO "_knex_temp_alter911" SELECT * FROM "pastebin";;');
    this.addSql('DROP TABLE "pastebin";');
    this.addSql('ALTER TABLE "_knex_temp_alter911" RENAME TO "pastebin";');
    this.addSql('PRAGMA foreign_keys = ON;');

    this.addSql('PRAGMA foreign_keys = OFF;');
    this.addSql('CREATE TABLE `_knex_temp_alter347` (`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL, `type` text NOT NULL, `value` text NOT NULL DEFAULT \'\', `additional_data` json NULL, `created_at` datetime NOT NULL);');
    this.addSql('INSERT INTO "_knex_temp_alter347" SELECT * FROM "stat";;');
    this.addSql('DROP TABLE "stat";');
    this.addSql('ALTER TABLE "_knex_temp_alter347" RENAME TO "stat";');
    this.addSql('PRAGMA foreign_keys = ON;');
  }

}
exports.Migration20230930114910 = Migration20230930114910;
