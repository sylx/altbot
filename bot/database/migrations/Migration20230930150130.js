'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const { Migration } = require('@mikro-orm/migrations');

class Migration20230930150130 extends Migration {

  async up() {
    this.addSql('alter table `ng_word` rename column `reaction` to `reactions`;');
  }

}
exports.Migration20230930150130 = Migration20230930150130;
