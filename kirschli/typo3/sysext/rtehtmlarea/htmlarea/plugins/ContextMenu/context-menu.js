/***************************************************************
*  Copyright notice
*
*  Copyright (c) 2003 dynarch.com. Authored by Mihai Bazon. Sponsored by www.americanbible.org.
*  Copyright (c) 2004-2010 Stanislas Rolland <typo3(arobas)sjbr.ca>
*  All rights reserved
*
*  This script is part of the TYPO3 project. The TYPO3 project is
*  free software; you can redistribute it and/or modify
*  it under the terms of the GNU General Public License as published by
*  the Free Software Foundation; either version 2 of the License, or
*  (at your option) any later version.
*
*  The GNU General Public License can be found at
*  http://www.gnu.org/copyleft/gpl.html.
*  A copy is found in the textfile GPL.txt and important notices to the license
*  from the author is found in LICENSE.txt distributed with these scripts.
*
*
*  This script is distributed in the hope that it will be useful,
*  but WITHOUT ANY WARRANTY; without even the implied warranty of
*  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*  GNU General Public License for more details.
*
*  This script is a modified version of a script published under the htmlArea License.
*  A copy of the htmlArea License may be found in the textfile HTMLAREA_LICENSE.txt.
*
*  This copyright notice MUST APPEAR in all copies of the script!
***************************************************************/
/*
 * Context Menu Plugin for TYPO3 htmlArea RTE
 *
 * TYPO3 SVN ID: $Id: context-menu.js 8946 2010-10-04 13:30:15Z stan $
 */
HTMLArea.ContextMenu = HTMLArea.Plugin.extend({
	constructor : function(editor, pluginName) {
		this.base(editor, pluginName);
	},
	/*
	 * This function gets called by the class constructor
	 */
	configurePlugin : function(editor) {
		this.pageTSConfiguration = this.editorConfiguration.contextMenu;
		if (!this.pageTSConfiguration) {
			this.pageTSConfiguration = {};
		}
		if (this.pageTSConfiguration.showButtons) {
			this.showButtons = this.pageTSConfiguration.showButtons;
		}
		if (this.pageTSConfiguration.hideButtons) {
			this.hideButtons = this.pageTSConfiguration.hideButtons;
		}
		/*
		 * Registering plugin "About" information
		 */
		var pluginInformation = {
			version		: '3.1',
			developer	: 'Mihai Bazon & Stanislas Rolland',
			developerUrl	: 'http://www.sjbr.ca/',
			copyrightOwner	: 'dynarch.com & Stanislas Rolland',
			sponsor		: 'American Bible Society & SJBR',
			sponsorUrl	: 'http://www.sjbr.ca/',
			license		: 'GPL'
		};
		this.registerPluginInformation(pluginInformation);
		return true;
	},
	/*
	 * This function gets called when the editor gets generated
	 */
	onGenerate: function() {
			// Build the context menu
		this.menu = new Ext.menu.Menu(Ext.applyIf({
			cls: 'htmlarea-context-menu',
			defaultType: 'menuitem',
			listeners: {
				itemClick: {
					fn: this.onItemClick,
					scope: this
				},
				show: {
					fn: this.onShow,
					scope: this
				},
				hide: {
					fn: this.onHide,
					scope: this
				}
			},
			items: this.buildItemsConfig()
		}, this.pageTSConfiguration));
			// Monitor contextmenu clicks on the iframe
		this.menu.mon(Ext.get(this.editor.document.documentElement), 'contextmenu', this.show, this, {single: true});
			// Monitor editor being destroyed
		this.menu.mon(this.editor, 'beforedestroy', this.onBeforeDestroy, this, {single: true});
	},
	/*
	 * Create the menu items config
	 */
	buildItemsConfig: function () {
		var itemsConfig = [];
			// Walk through the editor toolbar configuration nested arrays: [ toolbar [ row [ group ] ] ]
		var firstInGroup = true, convertedItemId;
		Ext.each(this.editor.config.toolbar, function (row) {
				// Add the groups
			firstInGroup = true;
			Ext.each(row, function (group) {
				if (!firstInGroup) {
					// If a visible item was added to the line
					itemsConfig.push({
							xtype: 'menuseparator',
							cls: 'separator'
					});
				}
				firstInGroup = true;
					// Add each item
				Ext.each(group, function (itemId) {
					convertedItemId = this.editorConfiguration.convertButtonId[itemId];
					if ((!this.showButtons  || this.showButtons.indexOf(convertedItemId) !== -1)
						&& (!this.hideButtons || this.hideButtons.indexOf(convertedItemId) === -1)) {
						var button = this.getButton(itemId);
						if (button && button.getXType() === 'htmlareabutton' && !button.hideInContextMenu) {
							var itemId = button.getItemId();
							itemsConfig.push({
								itemId: itemId,
								cls: 'button',
								overCls: 'hover',
								text: (button.contextMenuTitle || button.tooltip.title),
								iconCls: button.iconCls,
								helpText: this.localize(itemId + '-helpText') || this.localize(itemId + '-tooltip'),
								hidden: true
							});
							firstInGroup = false;
						}
					}
					return true;
				}, this);
				return true;
			}, this);
			return true;
		}, this);
			// If a visible item was added
		if (!firstInGroup) {
			itemsConfig.push({
					xtype: 'menuseparator',
					cls: 'separator'
			});
		}
		 	// Add special target delete item
		var itemId = 'DeleteTarget';
		itemsConfig.push({
			itemId: itemId,
			cls: 'button',
			overCls: 'hover',
			iconCls: 'htmlarea-action-delete-item',
			helpText: this.localize('Remove this node from the document')
		});
		return itemsConfig;
	},
	/*
	 * Handler when the menu gets shown
	 */
	onShow: function () {
		this.menu.mun(Ext.get(this.editor.document.documentElement), 'contextmenu', this.show, this);
		this.menu.mon(Ext.get(this.editor.document.documentElement), 'mousedown', this.menu.hide, this.menu, {single: true});
	},
	/*
	 * Handler when the menu gets hidden
	 */
	onHide: function () {
		this.menu.mon(Ext.get(this.editor.document.documentElement), 'contextmenu', this.show, this);
		this.menu.mun(Ext.get(this.editor.document.documentElement), 'mousedown', this.menu.hide, this.menu);
	},
	/*
	 * Handler to show the context menu
	 */
	show: function (event, target) {
			// Need to wait a while for the toolbar state to be updated
		this.showMenu.defer(150, this, [event, target]);
		event.stopEvent();
		return false;
	},
	/*
	 * Show the context menu
	 */
	showMenu: function (event, target) {
		this.showContextItems(target);
		var iframeEl = this.editor.iframe.getEl();
		this.menu.showAt([Ext.get(target).getX() + iframeEl.getX(), Ext.get(target).getY() + iframeEl.getY()]);
	},
	/*
	 * Show items depending on context
	 */
	showContextItems: function (target) {
		var lastIsSeparator = false, lastIsButton = false, xtype, lastVisible;
		this.menu.cascade(function (menuItem) {
			xtype = menuItem.getXType();
			if (xtype === 'menuseparator') {
				menuItem.setVisible(lastIsButton);
				lastIsButton = false;
			} else if (xtype === 'menuitem') {
				var button = this.getButton(menuItem.getItemId());
				if (button) {
					menuItem.setText(button.tooltip.title);
					menuItem.setVisible(!button.disabled);
					lastIsButton = lastIsButton || !button.disabled;
				} else {
						// Special target delete item
					this.deleteTarget = Ext.get(target);
					if (/^(html|body)$/i.test(target.nodeName)) {
						this.deleteTarget = null;
					} else if (/^(table|thead|tbody|tr|td|th|tfoot)$/i.test(target.nodeName)) {
						var targetAncestor = this.deleteTarget.findParent('table');
					} else if (/^(ul|ol|dl|li|dd|dt)$/i.test(target.nodeName)) {
						var targetAncestor = this.deleteTarget.findParent('ul') || this.deleteTarget.findParent('ol') || this.deleteTarget.findParent('dl');
					}
					if (targetAncestor) {
						this.deleteTarget = Ext.get(targetAncestor);
					}
					if (this.deleteTarget) {
						menuItem.setVisible(true);
						menuItem.setText(this.localize('Remove the') + ' &lt;' + this.deleteTarget.dom.nodeName.toLowerCase() + '&gt; ');
						lastIsButton = true;
					} else {
						menuItem.setVisible(false);
					}
				}
			}
			if (!menuItem.hidden) {
				lastVisible = menuItem;
			}
		}, this);
			// Hide the last item if it is a separator
		if (!lastIsButton) {
			lastVisible.setVisible(false);
		}
	},
	/*
	 * Handler invoked when a menu item is clicked on
	 */
	onItemClick: function (item, event) {
		var button = this.getButton(item.getItemId());
		if (button) {
			button.fireEvent('context', button, event);
		} else if (item.getItemId() === 'DeleteTarget') {
				// Do not leave a non-ie table cell empty
			var parent = this.deleteTarget.parent().dom;
			parent.normalize();
			if (!Ext.isIE && /^(td|th)$/i.test(parent.nodeName) && parent.childNodes.length == 1) {
					// Do not leave a non-ie table cell empty
				this.deleteTarget.insertSibling(this.editor.document.createElement('br'));
			}
				// Try to find a reasonable replacement selection
			var nextSibling = this.deleteTarget.dom.nextSibling;
			var previousSibling = this.deleteTarget.dom.previousSibling;
			if (nextSibling) {
				this.editor.selectNode(nextSibling, true);
			} else if (previousSibling) {
				this.editor.selectNode(previousSibling, false);
			}
			this.deleteTarget.remove();
			this.editor.updateToolbar();
		}
	},
	/*
	 * Handler invoked when the editor is about to be destroyed
	 */
	onBeforeDestroy: function () {
		this.menu.items.each(function (menuItem) {
			Ext.QuickTips.unregister(menuItem);
		});
	 	this.menu.removeAll(true);
	 	this.menu.destroy();
	}
});
