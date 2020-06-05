// JavaScript Document
(function($) {
	
	/**
	  * JQUERY WIDGETS
	  */
	$.fn.attachTrigger = function(event_to_listen, event_to_fire)
	{
		/** 
		  * Loop thru each matched and call repective functions 
		  */
		return this.each(function(i, el)
		{
			new /**/attachTriggerObj(el, event_to_listen, event_to_fire);
			//----------------------
		});
	}
	
	var attachTriggerObj = function(el, event_to_listen, callback)
	{
		var el = $(el);
		// Actions on subject element
		if (typeof event_to_listen == 'number')
		{
			setTimeout(function()
			{
				callback({type:'timeout'});
			}, event_to_listen);
			
			return;
		}

		var event_to_listen = event_to_listen.split(' ');
		$.each(event_to_listen, function(i, listen)
		{
			if (listen == 'click')
			{
				el.on('click', function(e)
				{
					callback(e);
					
					// Links should not be followed
					if (el.is('a, button'))
					{
						//return false;
						e.preventDefault();
					}
				})
			}
			else if (listen == 'focus')
			{
				el.on('focusin', function(e)
				{
					callback(e);
					
					// Links should not be followed
					if (el.is('a, button'))
					{
						//e.preventDefault(); // Doesn't work on focus
						return false;
					}
				})
				.on('focusout', function(e)
				{
					callback(e, false);
				})
			}
			else if (listen == 'hover')
			{
				el.on('mouseenter', function(e)
				{
					callback(e);
				})
				.on('mouseleave', function(e)
				{
					callback(e, false);
				})
			}
			else if (listen == 'select')
			{
				el.on('select', function(e)
				{
					callback(e);
				})
			}
			else if (listen == 'submit')
			{
				el.on('submit', function(e)
				{
					callback(e);
					
					// Links should not be followed
					//if (el.is('form'))
					{
						e.preventDefault();
					}
				})
			}
			else if (listen == 'change' || ~listen.indexOf('change#'))
			{
				el.on('change', function(e)
				{
					if (!~listen.indexOf('#'))
					{
						if (el.val())
						{
							callback(e);
						}
						else
						{
							callback(e, false);
						}
					}
					else
					{
						if (el.val() == listen.substr(listen.indexOf('#') + 1))
						{
							callback(e);
						}
						else
						{
							callback(e, false);
						}
					}
				})
			}
		})
	}
	
	
	/**
	  * OX WIDGETS
	  */
	window.Ox =
	{
		parseProps: function(attr)
		{
			var obj = {};
			if (attr)
			{
				$.each(attr.split(';'), function(i, param)
				{
					var prop = param.split(':');
					var key = prop[0].trim();
					var val = (prop[1] ? prop[1] : '').trim();
					
					obj[key] = (val == 'NULL' ? null : (val == 'TRUE' ? true : (val == 'FALSE' ? false : (!isNaN(val * 1) ? val * 1/*parseInt(val) 0.5 for example if becoming 0*/ : val))));
				})
			}
			
			return obj;
		},
		
		
		Datetime: function()
		{
			return new Ox.DatetimeObj();
		},
		
		DatetimeObj: function()
		{
			this.ago = function(time)
			{
				var periods = ['sec', 'min', 'hr', 'day', 'wk', 'mon', 'yr', 'dec'];
				var lengths = ['1000', '60', '60', '24', '7', '4.35', '12', '10'];
				
				var now = Date.now();
				var difference_original = now - time;
				var difference = difference_original;
				var tense = 'ago';
				var k = 0;
				/*remember js time is in millisec. So first division (by 1000) gives us the difference in secs*/
				
				for(var i = 0; i < lengths.length && difference >= lengths[i]; i ++) 
				{
					difference /= lengths[i];
					k = i;
				}
				
				difference = Math.round(difference);
				
				if(difference != 1) 
				{
					periods[k] += periods[k] == 'day' ? 's' : 's.';
				}
				else
				{
					periods[k] += periods[k] == 'day' ? '' : '.';
				}
				
				if (difference_original < 1000 * 60)
				{
					return 'Just Now';
				}
				
				return difference + ' ' + periods[k] + ' ' + tense;
			};
			
			
			this.strToTime = function(date_str)
			{
				if (!isNaN(date_str * 1))
				{
					return parseInt(date_str);
				}
				
				if (~date_str.indexOf('mons') || ~date_str.indexOf('days') || ~date_str.indexOf('hrs') || ~date_str.indexOf('mins') || ~date_str.indexOf('secs'))
				{
					return this.valToTime(date_str);
				}
				
				return (new Date(date_str)).getTime();
			};
			
			
			this.valToTime = function(input)
			{
				if (!input)
				{
					return Date.now();
				}
				else
				{
					// Input is human readable values: 5 days, +3 hrs, etc.
					// A space separates number and period
					var value = Math.abs(parseInt(input));
					var operator = input.substr(0,1);
					// These replacements are only once. Consider regex for multiple. E.g: .replace(/ /g, '')
					var period = input.replace(value, '').replace('-', '').replace('+', '').replace(' ', '');
	
					var timestamp/*secs*/ = value * 1000;
					
					
					// Currently 1 sec if input is 1
					if (period == 'mins'|| period == 'hrs'|| period == 'days' || period == 'mons')
					{
						// Currently 1 min if input is 1
						timestamp = timestamp * 60;
					}
					if (period == 'hrs'|| period == 'days' || period == 'mons')
					{
						// Currently 1 hrs if input is 1
						timestamp = timestamp * 60;
					}
					if (period == 'days' || period == 'mons')
					{
						// Currently 1 day if input is 1
						timestamp = timestamp * 24;
					}
					if (period == 'mons')
					{
						// Currently 1 month if input is 1
						timestamp = timestamp * 30;
					}
					
					// Add or subtract this timestamp value to or from current timestamp
					if (operator == '+' || operator == '-')
					{
						d = new Date();
						timestamp = d.setTime(d.getTime() + (operator == '+' ? timestamp : -timestamp));
						
					}
					
					return timestamp;
				}
			}
		},
		
		
		Storage: function(key, category)
		{
			return new Ox.StorageObj(key, category);
		},
  
		StorageObj: function(key, category)
		{
			this.key = key;
			this.category = category;
			
			this.available = function()
			{
				return typeof window.localStorage !== 'undefined';
			}
			
			this.setVal = function(value)
			{
				this.value = value;
				return this;
			}
			
			
			
			
			
			var storageSet = function(type, key, value)
			{
				if ((type !== 'local' && type !== 'session') || typeof window[type + 'Storage'] == 'undefined' || !key)
				{
					return;
				}
				
				window[type + 'Storage'].setItem(key, value);
				
				return true;
			}
			
			var storageGet = function(type, key)
			{
				if ((type !== 'local' && type !== 'session') || typeof window[type + 'Storage'] == 'undefined' || !key)
				{
					return;
				}
				
				return window[type + 'Storage'].getItem(key);
			}
			
			var storageRemove = function(type, key)
			{
				if ((type !== 'local' && type !== 'session') || typeof window[type + 'Storage'] == 'undefined' || !key)
				{
					return;
				}
				
				window[type + 'Storage'].removeItem(key);
				
				return true;
			}
			
			
			
			
			var jsonCategory = function(main_value, category_name, category_value, remove_category)
			{
				// Work with category
				if (main_value)
				{
					parent_json = typeof main_value == 'object' ? main_value : JSON.parse(main_value);
				}
				else
				{
					parent_json = {};
				}
				
				if (typeof category_value == 'undefined' || remove_category)
				{
					if (remove_category)
					{
						// Delete category from parent
						if (parent_json[category_name])
						{
							delete parent_json[category_name];
						}
						
						// Return value is everything back - the remainder
						return_value = parent_json;
					}
					else
					{
						// Return value from category
						return_value = parent_json[category_name];
					}
				}
				else
				{
					// Set value to category in parent
					parent_json[category_name] = category_value;
					// Return value is everything back
					return_value = parent_json;
				}
				
				return typeof return_value == 'object' ? JSON.stringify(return_value)/*Set is always object*/ : return_value;
			}
			
			
			
			
			// Session storage
			this.setToSession = function()
			{
				if (this.category)
				{
					var main_value = storageGet('session', this.key);
					var whole_value = jsonCategory(main_value, this.category, this.value);
					
					if (storageSet('session', this.key, whole_value))
					{
						return this;
					}
				}
				else
				{
					if (storageSet('session', this.key, whole_value))
					{
						return this;
					}
				}
			}
			
			this.getFromSession = function()
			{
				if (this.category)
				{
					var main_value = storageGet('session', this.key);
					var category_value = jsonCategory(main_value, this.category);
					
					return category_value;
				}
				else
				{
					return storageGet('session', this.key)
				}
			}
			
			this.removeFromSession = function()
			{
				if (this.category)
				{
					var main_value = storageGet('session', this.key);
					var remainder = jsonCategory(main_value, this.category, null/*category_value*/, true/*remove_category*/);
					
					if (storageSet('session', this.key, remainder))
					{
						return this;
					}
				}
				else
				{
					storageRemove('session', this.key);
				}
				
				return this;
			}
			
			
	
			
			
			
			// Local storage
			this.setToLocal = function()
			{
				if (this.category)
				{
					var main_value = storageGet('local', this.key);
					var whole_value = jsonCategory(main_value, this.category, this.value);
					
					if (storageSet('local', this.key, whole_value))
					{
						return this;
					}
				}
				else
				{
					if (storageSet('local', this.key, whole_value))
					{
						return this;
					}
				}
			}
			
			this.getFromLocal = function()
			{
				if (this.category)
				{
					var main_value = storageGet('local', this.key);
					var category_value = jsonCategory(main_value, this.category);
					
					return category_value;
				}
				else
				{
					return storageGet('local', this.key);
				}
			}
			
			this.removeFromLocal = function()
			{
				if (this.category)
				{
					var main_value = storageGet('local', this.key);
					var remainder = jsonCategory(main_value, this.category, null/*category_value*/, true/*remove_category*/);
					
					if (storageSet('local', this.key, remainder))
					{
						return this;
					}
				}
				else
				{
					storageRemove('local', this.key);
				}
				
				return this;
			}
			
			
			
			
	
	
			
			// Cookies
			this.setToCookie = function(exdays) 
			{
				if (!this.key)
				{
					return false;
				}
				
				var d = new Date();
				d.setTime(Ox.Datetime().valToTime('+' + exdays + 'days'));
				var expires = 'expires=' + d.toUTCString();
				document.cookie = this.key + '=' + this.value + '; ' + expires;
			}
		
			this.getFromCookie = function(cname) 
			{
				if (!this.key)
				{
					return false;
				}
				
				var name = this.key + '=';
				var ca = document.cookie.split(';');
				for(var i = 0; i < ca.length; i ++) 
				{
					var c = ca[i];
					while (c.charAt(0) == ' ') 
					{
						c = c.substring(1);
					}
					if (c.indexOf(name) == 0) 
					{
						return c.substring(name.length, c.length);
					}
				}
				
				return '';
			}
			
			this.removeFromCookie = function(cname)
			{
				if (!this.key)
				{
					return false;
				}
				
				document.cookie = this.key + '=1; expires=Thu, 01 Jan 1970 00:00:00 UTC';
			}
		},
		
	
		toCamelCase: function(str, strict)
		{
			return str.replace(/\w\S*/g,  function(txt) { return txt.charAt(0).toUpperCase() + ((typeof strict !== undefined && strict) ? txt.substr(1).toLowerCase() : txt.substr(1)); })
		},
		
		fromCamelCase: function(str, delimiter)
		{
			return str.split(/(?=[A-Z])/).join(delimiter ? delimiter : ' '); // positive lookahead to keep the capital letters
		},
		
		
		browserCssSupport: function(property)
		{
			prefixes = ['', 'Webkit', 'Moz', 'O', 'ms', 'Khtml'];
			for (var i = 0; i < prefixes.length; i ++)
			{
				// Make disting words
				var prop = property.replace(/-/g, ' ');
	
				if (i === 0)
				{
					// Don't camel-case first word. We need something like: backgroundColor
					prop = prop.substr(0, 1).toLowerCase() + Ox.toCamelCase(prop.substr(1));
				}
				else
				{
					// Camel-case everything. We need something like: MozBackgroundColor
					prop = prefixes[i] + Ox.toCamelCase(prop);
				}
				
				// Back to single word
				prop = prop.replace(/ /g, '');
				
				if (prop in document.body.style)
				{
					return true;
				}
			}
			
			return false;
		},
	}
})(jQuery)
