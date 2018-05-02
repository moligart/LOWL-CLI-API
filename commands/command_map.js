// CLI gametype
const { ls } = require('./cli/cmd_ls');
const { cd } = require('./cli/cmd_cd');
const { cat } = require('./cli/cmd_cat');
const { help } = require('./cli/cmd_help');
const { open } = require('./cli/cmd_open');

module.exports.cli = {
    cd,
    ls,
    cat,
    open,
    help,
}