Template.afIconHelp.onRendered(function () {

    if (this.data.type === 'popover')
        this.$('[data-toggle="popover"]').popover();
    else
        this.$('[data-toggle="tooltip"]').tooltip()
});
Template.afIconHelp.helpers({
    data: function () {
        return Object.assign({
            type: 'popover',
            placement: 'top',
            icon: 'glyphicon glyphicon-info-sign',
            trigger: 'hover'
        }, this);
    },

    'isPopOver': function () {
        return this.type == 'popover'
    }
});
