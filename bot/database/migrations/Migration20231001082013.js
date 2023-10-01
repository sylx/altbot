'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const { Migration } = require('@mikro-orm/migrations');

class Migration20231001082013 extends Migration {

  async up() {
    this.addSql('create table `ng_word_history` (`id` integer not null primary key autoincrement, `created_at` datetime not null, `updated_at` datetime not null, `member_id` text not null, `hit_word` text not null, `hit_score` integer not null, `ngword_id` integer, constraint `ng_word_history_ngword_id_foreign` foreign key(`ngword_id`) references `ng_word`(`id`) on update cascade on delete set null);');
    this.addSql('create index `ng_word_history_ngword_id_index` on `ng_word_history` (`ngword_id`);');
  }

}
exports.Migration20231001082013 = Migration20231001082013;
