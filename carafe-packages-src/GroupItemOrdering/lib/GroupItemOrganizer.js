"use strict";
import sortable from 'html5sortable/dist/html5sortable.es';

export default class GroupItemOrganizer {
    constructor(dataSet) {
        this.itemslist = jQuery('#itemslist');

        jQuery.each(dataSet, (index, dataRow) => {
            if (undefined === dataRow.group) {
                this.itemslist.append(this.buildItem(dataRow));
            } else {
                let groupList = jQuery('li[data-id="'+dataRow.group+'"]').find('ul');
                groupList.append(this.buildItem(dataRow));
            }
        });

        let innerContainers = sortable('.js-sortable-inner-connected', {
            forcePlaceholderSize: true,
            connectWith: 'js-inner-connected',
            items: '.item',
            placeholderClass: 'dashedborder',
        });

        sortable('.js-sortable-connected', {
            forcePlaceholderSize: true,
            connectWith: '.js-connected',
            items: 'li',
            placeholderClass: 'dashedborder',
        });

        jQuery.each(innerContainers, (index, container) => {
            container.addEventListener('sortupdate', function(e) {
                if ('itemslist' === jQuery(e.detail.destination.container).closest('ul').attr('id')) {
                    jQuery(e.detail.item).find('td.tdremovebutton').hide();
                } else {
                    jQuery(e.detail.item).find('td.tdremovebutton').show();
                }
            })
        });

        sortable('.js-sortable-connected', {
            forcePlaceholderSize: true,
            items: ':not(.disabled)',
        });

        jQuery('.removebutton').on('click', (e) => {
            jQuery(e.currentTarget).closest('td').hide();
            GroupItemOrganizer.moveToUnGrouped(parseInt(jQuery(e.currentTarget).closest('tr').attr('id')));
        });

        this.itemslist.find('.removebutton').closest('td').hide();
    }

    buildItem (data) {
        let lineItem = '<li id="' + data.id + '" data-id="' + data.id + '" data-type="item" class="p1 mb1 border bg-olive item cardshadow">';
        lineItem += '    <table>';
        lineItem += '        <tr class="itemrow" id="' + data.id + '-tr">';
        lineItem += '            <td class="tabledata itemid">ID: ' + data.id + '</td>';
        lineItem += '            <td class="tabledata itemname">Item: ' + data.item + '</td>';
        lineItem += '            <td class="tabledata">Quantity: ' + data.quantity + '</td>';
        lineItem += '            <td class="tabledata">Order Number: ' + data.orderNumber + '</td>';
        lineItem += '            <td class="tdremovebutton"><button class="removebutton">Remove</button></td>';
        lineItem += '        </tr>';
        lineItem += '    </table>';
        lineItem += '</li>';
        return lineItem
    }

    static moveToUnGrouped (id) {
        let a = jQuery('#' + id);
        $("#itemslist").append(a);
    }
};
