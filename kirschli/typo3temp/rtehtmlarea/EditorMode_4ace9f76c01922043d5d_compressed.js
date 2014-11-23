HTMLArea.EditorMode=HTMLArea.Plugin.extend({constructor:function(editor,pluginName){this.base(editor,pluginName);},configurePlugin:function(editor){var pluginInformation={version:"2.0",developer:"Stanislas Rolland",developerUrl:"http://www.sjbr.ca/",copyrightOwner:"Stanislas Rolland",sponsor:"SJBR",sponsorUrl:"http://www.sjbr.ca/",license:"GPL"};this.registerPluginInformation(pluginInformation);var buttonList=this.buttonList,buttonId;for(var i=0,n=buttonList.length;i<n;++i){var button=buttonList[i];buttonId=button[0];var buttonConfiguration={id:buttonId,tooltip:this.localize(buttonId+'-Tooltip'),iconCls:'htmlarea-action-editor-toggle-mode',action:'onButtonPress',context:button[1],textMode:(buttonId=='TextMode')};this.registerButton(buttonConfiguration);}
return true;},buttonList:[['TextMode',null]],onButtonPress:function(editor,id,target){var buttonId=this.translateHotKey(id);buttonId=buttonId?buttonId:id;this.editor.setMode((this.editor.getMode()==buttonId.toLowerCase())?'wysiwyg':buttonId.toLowerCase());return false;},onUpdateToolbar:function(button,mode,selectionEmpty,ancestors){button.setInactive(mode!==button.itemId.toLowerCase());}});