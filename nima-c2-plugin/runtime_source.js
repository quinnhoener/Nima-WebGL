// ECMAScript 5 strict mode
"use strict";

assert2(cr, "cr namespace not created");
assert2(cr.plugins_, "cr.plugins_ not created");

/////////////////////////////////////
// Plugin class
// *** CHANGE THE PLUGIN ID HERE *** - must match the "id" property in edittime.js
//          vvvvvvvv
cr.plugins_.NimaPlugin = function(runtime)
{
	this.runtime = runtime;
};

(function ()
{
	/////////////////////////////////////
	// *** CHANGE THE PLUGIN ID HERE *** - must match the "id" property in edittime.js
	//                            vvvvvvvv
	var pluginProto = cr.plugins_.NimaPlugin.prototype;
		
	/////////////////////////////////////
	// Object type class
	pluginProto.Type = function(plugin)
	{
		this.plugin = plugin;
		this.runtime = plugin.runtime;
	};

	var typeProto = pluginProto.Type.prototype;

	// called on startup for each object type
	typeProto.onCreate = function()
	{
	};

	/////////////////////////////////////
	// Instance class
	pluginProto.Instance = function(type)
	{
		this.type = type;
		this.runtime = type.runtime;
		
		// any other properties you need, e.g...
		// this.myValue = 0;
	};
	
	var instanceProto = pluginProto.Instance.prototype;

	// called whenever an instance is created
	instanceProto.onCreate = function()
	{
		// note the object is sealed after this call; ensure any properties you'll ever need are set on the object
		// e.g...
		// this.myValue = 0;
		
		// Nima Data
		this.NimaDataUrl = this.properties[0] || "";
		// The starting animation name to play. 
		this.StartAnim = this.properties[1] || "";
		this.BaseWidth = this.properties[2] || "";
		this.BaseHeight = this.properties[3] || "";
		// Keep track of the currently playing animation. 
		this.CurrentAnimation = null;

		this._Graphics = new Graphics(this.runtime.canvas);

		this._ViewTransform = _mat2d.create();
		this._Graphics.setView(this._ViewTransform);

		this._Actor = null;
		this._ActorInstance = null;

		var loader = new ActorLoader();
		var _This = this;
		loader.load(this.NimaDataUrl, function(actor)
		{
			if(!actor || actor.error)
			{
				console.log("Error loading Nima data at url: " + _This.NimaDataUrl);
			}
			else
			{
				_This.setActor(actor);
			}
		});
	};
	
	instanceProto.setActor = function(actor)
	{
		actor.initialize(this._Graphics);

		var actorInstance = actor.makeInstance();
		actorInstance.initialize(this._Graphics);

		this._Actor = actor;
		this._ActorInstance = actorInstance;

		this.CurrentAnimation = actorInstance.getAnimationInstance(this.StartAnim);

		this.runtime.tickMe(this);
	}

	instanceProto.tick = function()
	{
		var dt = this.runtime.getDt(this);

		this.CurrentAnimation.advance(dt);
		this.CurrentAnimation.apply(this._ActorInstance, 1);
		this._ActorInstance.advance(dt);

		this.runtime.redraw = true;
	}

	// called whenever an instance is destroyed
	// note the runtime may keep the object after this call for recycling; be sure
	// to release/recycle/reset any references to other objects in this function.
	instanceProto.onDestroy = function ()
	{
		if(this._Actor)
		{
			this._Actor.dispose(this._Graphics);
		}
		if(this._ActorInstance)
		{
			this._ActorInstance.dispose(this._Graphics);
		}
		this.NimaDataUrl = null;
		this.StartAnim = null;
		this.DefaultScale = null;
		this.CurrentAnimation = null;
		this._Actor = null;
		this._ActorInstance = null;
		this._Graphics = null;
		this._ViewTransform = null;
	};
	
	// called when saving the full state of the game
	instanceProto.saveToJSON = function ()
	{
		// return a Javascript object containing information about your object's state
		// note you MUST use double-quote syntax (e.g. "property": value) to prevent
		// Closure Compiler renaming and breaking the save format
		return {
			// e.g.
			//"myValue": this.myValue
		};
	};
	
	// called when loading the full state of the game
	instanceProto.loadFromJSON = function (o)
	{
		// load from the state previously saved by saveToJSON
		// 'o' provides the same object that you saved, e.g.
		// this.myValue = o["myValue"];
		// note you MUST use double-quote syntax (e.g. o["property"]) to prevent
		// Closure Compiler renaming and breaking the save format
	};
	
	// only called if a layout object - draw to a canvas 2D context
	instanceProto.draw = function(ctx)
	{
		// Sadly don't support Canvas 2D at the moment. ;(
	};
	
	// only called if a layout object in WebGL mode - draw to the WebGL context
	// 'glw' is not a WebGL context, it's a wrapper - you can find its methods in GLWrap.js in the install
	// directory or just copy what other plugins do.
	instanceProto.drawGL = function (glw)
	{
		if ( this._ActorInstance != null )
		{
			if (glw.gl !== this.runtime.gl) {
			  console.log("error: gl", glw.gl, this.runtime.gl);
			}

			// suspend glwrap
			var gl = this.runtime.gl;
			glw.endBatch();

			var projection = this._Graphics.projection;
			// var color = instance.extra.render_webgl.color;

			var flip_x = (this.width < 0)?(-1):(1);
			var flip_y = (this.height < 0)?(-1):(1);
			var tx = this.x;
			var ty = this.y;
			var rz = this.angle * flip_x * flip_y;
			var sx = this.width / this.BaseWidth;
			var sy = -this.height / this.BaseHeight;

			_mat4.multiply(projection, glw.matP, glw.matMV);
			_mat4.translate(projection, projection, _vec3.fromValues(tx, ty, 0.0));
			_mat4.rotateZ(projection, projection, rz);
			_mat4.scale(projection, projection, _vec3.fromValues(sx, sy, 1.0));

			// color[3] = instance.opacity;


			// this._Graphics.clear();
			this._ActorInstance.draw(this._Graphics);

			/// resume glwrap

			// the Nima renderer might change this
			glw.lastSrcBlend = gl.ONE;
			glw.lastDestBlend = gl.ONE_MINUS_SRC_ALPHA;
			gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

			// GLBatchJob::doQuad does not bind the element array buffer
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, glw.indexBuffer);

			// the Nima renderer changes this
			glw.lastTexture0 = null;
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, null);

			// reload the GLWrap program
			glw.lastProgram = -1;
			glw.switchProgram(0);
		}
	};
	
	// The comments around these functions ensure they are removed when exporting, since the
	// debugger code is no longer relevant after publishing.
	/**BEGIN-PREVIEWONLY**/
	instanceProto.getDebuggerValues = function (propsections)
	{
		// Append to propsections any debugger sections you want to appear.
		// Each section is an object with two members: "title" and "properties".
		// "properties" is an array of individual debugger properties to display
		// with their name and value, and some other optional settings.
		propsections.push({
			"title": "My debugger section",
			"properties": [
				// Each property entry can use the following values:
				// "name" (required): name of the property (must be unique within this section)
				// "value" (required): a boolean, number or string for the value
				// "html" (optional, default false): set to true to interpret the name and value
				//									 as HTML strings rather than simple plain text
				// "readonly" (optional, default false): set to true to disable editing the property
				
				// Example:
				// {"name": "My property", "value": this.myValue}
			]
		});
	};
	
	instanceProto.onDebugValueEdited = function (header, name, value)
	{
		// Called when a non-readonly property has been edited in the debugger. Usually you only
		// will need 'name' (the property name) and 'value', but you can also use 'header' (the
		// header title for the section) to distinguish properties with the same name.
		if (name === "My property")
			this.myProperty = value;
	};
	/**END-PREVIEWONLY**/

	//////////////////////////////////////
	// Conditions
	function Cnds() {};

	// the example condition
	Cnds.prototype.MyCondition = function (myparam)
	{
		// return true if number is positive
		return myparam >= 0;
	};
	
	// ... other conditions here ...
	
	pluginProto.cnds = new Cnds();
	
	//////////////////////////////////////
	// Actions
	function Acts() {};

	// the example action
	Acts.prototype.MyAction = function (myparam)
	{
		// alert the message
		alert(myparam);
	};
	
	// ... other actions here ...
	
	pluginProto.acts = new Acts();
	
	//////////////////////////////////////
	// Expressions
	function Exps() {};
	
	// the example expression
	Exps.prototype.MyExpression = function (ret)	// 'ret' must always be the first parameter - always return the expression's result through it!
	{
		ret.set_int(1337);				// return our value
		// ret.set_float(0.5);			// for returning floats
		// ret.set_string("Hello");		// for ef_return_string
		// ret.set_any("woo");			// for ef_return_any, accepts either a number or string
	};
	
	// ... other expressions here ...
	
	pluginProto.exps = new Exps();

}());