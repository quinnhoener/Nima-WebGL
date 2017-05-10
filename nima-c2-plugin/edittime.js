﻿function GetPluginSettings()
{
	return {
		"name":			"Nima",				// as appears in 'insert object' dialog, can be changed as long as "id" stays the same
		"id":			"NimaPlugin",				// this is used to identify this plugin and is saved to the project; never change it
		"version":		"1.0",					// (float in x.y format) Plugin version - C2 shows compatibility warnings based on this
		"description":	"Create a Nima animation object.",
		"author":		"Quinn Hoener",
		"help url":		"https://www.scirra.com/manual/106/plugin-reference",
		"category":		"General",				// Prefer to re-use existing categories, but you can set anything here
		"type":			"world",				// either "world" (appears in layout and is drawn), else "object"
		"rotatable":	true,					// only used when "type" is "world".  Enables an angle property on the object.
		"flags":		0						// uncomment lines to enable flags...
					//	| pf_singleglobal		// exists project-wide, e.g. mouse, keyboard.  "type" must be "object".
					//	| pf_texture			// object has a single texture (e.g. tiled background)
						| pf_position_aces		// compare/set/get x, y...
						| pf_size_aces			// compare/set/get width, height...
						| pf_angle_aces			// compare/set/get angle (recommended that "rotatable" be set to true)
						| pf_appearance_aces	// compare/set/get visible, opacity...
					//	| pf_tiling				// adjusts image editor features to better suit tiled images (e.g. tiled background)
						| pf_animations			// enables the animations system.  See 'Sprite' for usage
						| pf_zorder_aces		// move to top, bottom, layer...
					//  | pf_nosize				// prevent resizing in the editor
					//	| pf_effects			// allow WebGL shader effects to be added
					// 	| pf_predraw			// set for any plugin which draws and is not a sprite (i.e. does not simply draw
												// a single non-tiling image the size of the object) - required for effects to work properly
	};
};

////////////////////////////////////////
// Parameter types:
// AddNumberParam(label, description [, initial_string = "0"])			// a number
// AddStringParam(label, description [, initial_string = "\"\""])		// a string
// AddAnyTypeParam(label, description [, initial_string = "0"])			// accepts either a number or string
// AddCmpParam(label, description)										// combo with equal, not equal, less, etc.
// AddComboParamOption(text)											// (repeat before "AddComboParam" to add combo items)
// AddComboParam(label, description [, initial_selection = 0])			// a dropdown list parameter
// AddObjectParam(label, description)									// a button to click and pick an object type
// AddLayerParam(label, description)									// accepts either a layer number or name (string)
// AddLayoutParam(label, description)									// a dropdown list with all project layouts
// AddKeybParam(label, description)										// a button to click and press a key (returns a VK)
// AddAnimationParam(label, description)								// a string intended to specify an animation name
// AddAudioFileParam(label, description)								// a dropdown list with all imported project audio files

////////////////////////////////////////
// Conditions

// AddCondition(id,					// any positive integer to uniquely identify this condition
//				flags,				// (see docs) cf_none, cf_trigger, cf_fake_trigger, cf_static, cf_not_invertible,
//									// cf_deprecated, cf_incompatible_with_triggers, cf_looping
//				list_name,			// appears in event wizard list
//				category,			// category in event wizard list
//				display_str,		// as appears in event sheet - use {0}, {1} for parameters and also <b></b>, <i></i>
//				description,		// appears in event wizard dialog when selected
//				script_name);		// corresponding runtime function name
				
// example				
AddNumberParam("Number", "Enter a number to test if positive.");
AddCondition(0, cf_none, "Is number positive", "My category", "{0} is positive", "Description for my condition!", "MyCondition");

////////////////////////////////////////
// Actions

// AddAction(id,				// any positive integer to uniquely identify this action
//			 flags,				// (see docs) af_none, af_deprecated
//			 list_name,			// appears in event wizard list
//			 category,			// category in event wizard list
//			 display_str,		// as appears in event sheet - use {0}, {1} for parameters and also <b></b>, <i></i>
//			 description,		// appears in event wizard dialog when selected
//			 script_name);		// corresponding runtime function name

// example
AddStringParam("Message", "Enter a string to alert.");
AddAction(0, af_none, "Alert", "My category", "Alert {0}", "Description for my action!", "MyAction");

////////////////////////////////////////
// Expressions

// AddExpression(id,			// any positive integer to uniquely identify this expression
//				 flags,			// (see docs) ef_none, ef_deprecated, ef_return_number, ef_return_string,
//								// ef_return_any, ef_variadic_parameters (one return flag must be specified)
//				 list_name,		// currently ignored, but set as if appeared in event wizard
//				 category,		// category in expressions panel
//				 exp_name,		// the expression name after the dot, e.g. "foo" for "myobject.foo" - also the runtime function name
//				 description);	// description in expressions panel

// example
AddExpression(0, ef_return_number, "Leet expression", "My category", "MyExpression", "Return the number 1337.");

////////////////////////////////////////
ACESDone();

////////////////////////////////////////
// Array of property grid properties for this plugin
// new cr.Property(ept_integer,		name,	initial_value,	description)		// an integer value
// new cr.Property(ept_float,		name,	initial_value,	description)		// a float value
// new cr.Property(ept_text,		name,	initial_value,	description)		// a string
// new cr.Property(ept_color,		name,	initial_value,	description)		// a color dropdown
// new cr.Property(ept_font,		name,	"Arial,-16", 	description)		// a font with the given face name and size
// new cr.Property(ept_combo,		name,	"Item 1",		description, "Item 1|Item 2|Item 3")	// a dropdown list (initial_value is string of initially selected item)
// new cr.Property(ept_link,		name,	link_text,		description, "firstonly")		// has no associated value; simply calls "OnPropertyChanged" on click

var property_list = [
		new cr.Property(ept_text, "Nima Data URL", "", "Nima data file from export."),
		new cr.Property(ept_text, "Start Anim", "", "Animation to play on start."),
		new cr.Property(ept_integer, "Base Width", 100, "Default view width of the Nima animation."),
		new cr.Property(ept_integer, "Base Height", 100, "Default view height of the Nima animation.")
	];
	
// Called by IDE when a new object type is to be created
function CreateIDEObjectType()
{
	return new IDEObjectType();
}

// Class representing an object type in the IDE
function IDEObjectType()
{
	assert2(this instanceof arguments.callee, "Constructor called as a function");
}

// Called by IDE when a new object instance of this type is to be created
IDEObjectType.prototype.CreateInstance = function(instance)
{
	return new IDEInstance(instance);
}

// Class representing an individual instance of an object in the IDE
// Class representing an individual instance of an object in the IDE
function IDEInstance(instance, type) {
  assert2(this instanceof arguments.callee, "Constructor called as a function");

  // Save the constructor parameters
  this.instance = instance;
  this.type = type;

  // Set the default property values from the property table
  this.properties = {};

  for (var i = 0; i < property_list.length; i++)
    this.properties[property_list[i].name] = property_list[i].initial_value;

  // Plugin-specific variables
  // this.myValue = 0...
  this.just_inserted = false;
  this.texture_loaded = false;
  this.last_imgsize = new cr.vector2(0, 0);
  this.last_texture = null;
  this.last_texture_id = "";
}

IDEInstance.prototype.OnAfterLoad = function () {
  // Must initialise last_imgsize for correct updating of sprites on layouts without a tab open
  var texture = this.instance.GetTexture(this.properties["Initial frame"], this.properties["Initial animation"]);
  this.last_imgsize = texture.GetImageSize();
}

// Called when inserted via Insert Object Dialog for the first time
IDEInstance.prototype.OnInserted = function() {
  this.just_inserted = true;
}

// Called when double clicked in layout
IDEInstance.prototype.OnDoubleClicked = function() {
  this.instance.EditTexture();
}

// Called after a property has been changed in the properties bar
IDEInstance.prototype.OnPropertyChanged = function(property_name) {
}

// For rendered objects to load fonts or textures
IDEInstance.prototype.OnRendererInit = function(renderer) {
  this.last_texture = this.instance.GetTexture(this.properties["Initial frame"], this.properties["Initial animation"]);
  this.last_texture_id = this.last_texture.GetID();

  renderer.LoadTexture(this.last_texture);
  this.texture_loaded = true;

  this.instance.SetHotspot(this.last_texture.GetHotspot());
}

// Called to draw self in the editor if a layout object
IDEInstance.prototype.Draw = function(renderer) {
  var texture = this.instance.GetTexture(this.properties["Initial frame"], this.properties["Initial animation"]);
  var texture_id = texture.GetID();

  if (this.last_texture_id !== "" && this.last_texture_id !== texture_id) {
    // Texture has changed: unload old and reload new.
    if (this.last_texture)
      renderer.ReleaseTexture(this.last_texture);

    renderer.LoadTexture(texture);
    this.instance.SetHotspot(texture.GetHotspot());
  }

  this.last_texture = texture;
  this.last_texture_id = texture_id;

  renderer.SetTexture(texture);

  var imgsize = texture.GetImageSize();

  // First draw after insert: use size of texture.
  // Done after SetTexture so the file is loaded and dimensions known, preventing
  // the file being loaded twice.
  if (this.just_inserted) {
    this.just_inserted = false;
    this.instance.SetSize(imgsize);

    RefreshPropertyGrid();    // show new size
  }
  // If not just inserted and the sprite texture has been edited and changed size, scale the texture accordingly.
  else if ((imgsize.x !== this.last_imgsize.x || imgsize.y !== this.last_imgsize.y)
    && (this.last_imgsize.x !== 0 && this.last_imgsize.y !== 0)) {
    var sz = new cr.vector2(imgsize.x / this.last_imgsize.x, imgsize.y / this.last_imgsize.y);
    var instsize = this.instance.GetSize();

    sz.mul(instsize.x, instsize.y);
    this.instance.SetSize(sz);
    this.instance.SetHotspot(texture.GetHotspot());

    RefreshPropertyGrid();    // show new size
  }

  this.last_imgsize = imgsize;

  if (renderer.SupportsFullSmoothEdges()) {
    // Get the object size and texture size
    var objsize = this.instance.GetSize();
    var texsize = texture.GetImageSize();

    // Calculate pixels per texel, then get a quad padded with a texel padding
    var pxtex = new cr.vector2(objsize.x / texsize.x, objsize.y / texsize.y);
    var q = this.instance.GetBoundingQuad(new cr.vector2(pxtex.x, pxtex.y));

    // Calculate the size of a texel in texture coordinates, then calculate texture coordinates
    // for the texel padded quad
    var tex = new cr.vector2(1.0 / texsize.x, 1.0 / texsize.y);
    var uv = new cr.rect(-tex.x, -tex.y, 1.0 + tex.x, 1.0 + tex.y);

    // Render a quad with a half-texel padding for smooth edges
    renderer.Quad(q, this.instance.GetOpacity(), uv);
  } else {
    // Fall back to half-smoothed or jagged edges, depending on what the renderer supports
    renderer.Quad(this.instance.GetBoundingQuad(), this.instance.GetOpacity());
  }
}

// For rendered objects to release fonts or textures
IDEInstance.prototype.OnRendererReleased = function(renderer) {
  this.texture_loaded = false;
  renderer.ReleaseTexture(this.last_texture);
}

IDEInstance.prototype.OnTextureEdited = function () {
  var texture = this.instance.GetTexture(this.properties["Initial frame"], this.properties["Initial animation"]);
  this.instance.SetHotspot(texture.GetHotspot());

  var imgsize = texture.GetImageSize();

  // If sprite texture has been edited and changed size, scale the texture accordingly.
  if ((imgsize.x !== this.last_imgsize.x || imgsize.y !== this.last_imgsize.y)
    && (this.last_imgsize.x !== 0 && this.last_imgsize.y !== 0)) {
    var sz = new cr.vector2(imgsize.x / this.last_imgsize.x, imgsize.y / this.last_imgsize.y);
    var instsize = this.instance.GetSize();

    sz.mul(instsize.x, instsize.y);
    this.instance.SetSize(sz);

    this.last_imgsize = imgsize;
  }
}