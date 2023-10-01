'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const { Migration } = require('@mikro-orm/migrations');

class Migration20231001061805 extends Migration {

  async up() {
    this.addSql('create table `data` (`key` text not null, `created_at` datetime not null, `updated_at` datetime not null, `value` text not null default \'\', primary key (`key`));');

    this.addSql('create table `guild` (`id` text not null, `created_at` datetime not null, `updated_at` datetime not null, `prefix` text null, `deleted` integer not null default false, `last_interact` datetime not null, primary key (`id`));');

    this.addSql('create table `ng_word` (`id` integer not null primary key autoincrement, `created_at` datetime not null, `updated_at` datetime not null, `words` text not null, `score` integer not null, `gentle_reactions` text not null, `normal_reactions` text not null, `guilty_reactions` text not null);');

    this.addSql('create table `stat` (`id` integer not null primary key autoincrement, `type` text not null, `value` text not null default \'\', `additional_data` json null, `created_at` datetime not null);');

    this.addSql('create table `user` (`id` text not null, `created_at` datetime not null, `updated_at` datetime not null, `last_interact` datetime not null, primary key (`id`));');
  }

}
exports.Migration20231001061805 = Migration20231001061805;
