'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const { Migration } = require('@mikro-orm/migrations');

class Migration20230930115415 extends Migration {

  async up() {
    this.addSql('create table `ng_word` (`id` integer not null primary key autoincrement, `created_at` datetime not null, `updated_at` datetime not null, `words` text not null, `reaction` text not null);');
  }

}
exports.Migration20230930115415 = Migration20230930115415;
