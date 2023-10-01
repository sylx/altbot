'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const { Migration } = require('@mikro-orm/migrations');

class Migration20231001143501 extends Migration {

  async up() {
    this.addSql('create table `ng_word_history` (`id` integer not null primary key autoincrement, `created_at` datetime not null, `updated_at` datetime not null, `member_id` text not null, `hit_word` text not null, `hit_score` integer not null);');
  }

}
exports.Migration20231001143501 = Migration20231001143501;
