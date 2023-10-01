'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const { Migration } = require('@mikro-orm/migrations');

class Migration20231001073220 extends Migration {

  async up() {
    this.addSql('alter table `ng_word` add column `count` integer not null default 0;');
    this.addSql('alter table `ng_word` add column `created_by` text;');
  }

}
exports.Migration20231001073220 = Migration20231001073220;
