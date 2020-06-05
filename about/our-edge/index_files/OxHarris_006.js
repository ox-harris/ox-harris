// JavaScript Document
(function($)
{
	$.fn.Presentation = function(settings, use_attr_opts)
	{
		return this.each(function(i, el)
		{
			new PresentationObject(el, settings, use_attr_opts);
		});
	}
	
	var PresentationObject = function(el, settings, use_attr_opts)
	{
		// Some functions from here have their own this
		// So they'll use main
		var main = this;
		
		main.params = {
			slide_elements_selector: '._slide_element',// visible_area | one_item
			thumbnails_container_selector: '._thumbnailnav_container',// 800ms
			slidenav_container_selector: '._slidenav_container',// 800ms
			animation_orientation: 'horizontal',// horizontal | vertical | horizontal,vertical
			additional_css3_ani: null,
			animation_cast: 'exit',// slide | fade
			animation_fn: 'slide',// slide | fade : reflect | zoomin | zoomout
			numeric_fade_amount: 0,//
			percentage_zoom_amount: 100,//
			percentage_slide_distance: 100,//
			animation_duration: 600,// 800ms
			auto_adjust_container_height: false,// 800ms
			try_use_svg_zoom: true,// 800ms
			rotation_amount: 360,
			easing: 'easeOut',// linear | swing
			
			event_namespace: 'presentation.',
			
			auto_play: false,//
			start_auto_play_after: 0,// 0ms
			auto_play_interval: 12000,// 4000 ms
			auto_play_pause_on_hover: true,//
			
			OnInitialize: null,
			OnPlayStateChange: null,
			OnStateChange: null
		};
		
		main.use_attr_opts = use_attr_opts;
		// The main presentation container
		main.presentation = $(el);
		
		// This is reference setting
		$.extend(main.params, settings);
		main.initParams = function()
		{
			// Get params from element's attribute
			if (main.presentation.attr('data-presentation-params') && main.use_attr_opts !== false && typeof Ox.parseProps !== 'undefined')
			{
				var el_params = Ox.parseProps(main.presentation.attr('data-presentation-params'));
				$.extend(main.params, el_params);
			}
		};
		
		main.initParams();
		
		// This will be changing
		main.runtime_params = main.params;
		main.runtime_params.animation_fn = main.runtime_params.animation_fn.toLowerCase().split(',');
		main.runtime_params.animation_cast = main.runtime_params.animation_cast.toLowerCase().split(',');
		main.runtime_params.animation_orientation = main.runtime_params.animation_orientation.toLowerCase().split(',');
		
		
		/* ----------------------------------------
		<triggers>: playstatechange {animation: started, completed. autoplay: started, stopped} 
		<individual-slides-trigger>: statechange {state: activating, active, deactivating, inactive}.
		------------------------------------------*/
		main.events = {
			playStateChange: function(type, state)
			{
				if (type === 'autoplay')
				{
					var data = {autoplay: state};
				}
				else if (type === 'animation')
				{
					var data = {animation: state};
				}
				
				// Callback
				if (typeof main.runtime_params.OnPlayStateChange === 'string')
				{
					window[main.runtime_params.OnPlayStateChange].call(main.presentation, data, main.entering_slide, main.exiting_slide);
				}
				else if (typeof main.runtime_params.OnPlayStateChange === 'function')
				{
					main.runtime_params.OnPlayStateChange.call(main.presentation, data, main.entering_slide, main.exiting_slide);
				}
				
				// Event
				main.presentation.trigger(main.runtime_params.event_namespace + 'playstatechange', data);
			},
			stateChange: function(cast_element, state)
			{
				var data = {state: state};
				
				// Callback
				if (typeof main.runtime_params.OnStateChange === 'string')
				{
					window[main.runtime_params.OnStateChange].call(main.presentation, data, main.entering_slide, main.exiting_slide);
				}
				else if (typeof main.runtime_params.OnStateChange === 'function')
				{
					main.runtime_params.OnStateChange.call(main.presentation, data, main.entering_slide, main.exiting_slide);
				}
				
				// Event
				if (cast_element === 'entering_slide')
				{
					main.entering_slide.attr('data-state', state);
					main.entering_slide.trigger(main.runtime_params.event_namespace + 'statechange', data);
					
					if (state == 'activating')
					{
						// Init height
						main.initialized();
					}
				}
				else
				{
					main.exiting_slide.attr('data-state', state);
					main.exiting_slide.trigger(main.runtime_params.event_namespace + 'statechange', data);
				}
			}
		};
		// ----------------------------------------
		
		
		main.getIdFromIndex = function(index)
		{
			return main.unique_id + '-' + index;
		}
		
		
		main.getIndexFromId = function(id)
		{
			return parseInt(id.substr(id.lastIndexOf('-') + 1));
		}
		
		
		main.getActiveElement = function()
		{
			return $(main.slide_elements.filter(function()
			{
				return $(this).attr('data-state') === 'active';
			})[0]);
		}
		
		
		main.getInverse = function(str)
		{
			var inverse;
			var pairs = ['left,right', 'top,bottom', 'width,height', 'horizontal,vertical', 'in,out', 'entry,exit'];
			$.each(pairs, function(i, pair)
			{
				pair_array = pair.split(',');
	
				if (pair_array[0] == str)
				{
					inverse = pair_array[1];
				}
				if (pair_array[1] == str)
				{
					inverse = pair_array[0];
				}
			})
			
			return inverse;
		}
		
	
		main.invertProps = function(props, use_values)
		{
			var base_props = $.extend({}, props);
					
			$.each(Object.keys(base_props), function(i, prop_name)
			{
				if (use_values)
				{
					props[prop_name] = base_props[main.getInverse(prop_name)];
					props[main.getInverse(prop_name)] = base_props[prop_name];
				}
				else
				{
					props[base_prop] = false;
					props[main.getInverse(base_prop)] = true;
				}
			})
		}
		
		
		main.setCast = function(entering_el_index)
		{
			main.active_el = main.getActiveElement();
			
			if (!main.active_el.length)
			{
				main.active_el = main.first_el;
			}
			
			main.exiting_slide = main.active_el;
			if (typeof entering_el_index !== 'undefined' && $(main.slide_elements[entering_el_index]).length)
			{
				main.entering_slide = $(main.slide_elements[entering_el_index]);
			}
			else
			{
				if (main.runtime_params.nav_dir == 'right')
				{
					if (main.active_el[0] != main.last_el[0])
					{
						main.entering_slide = main.active_el.next();
					}
					else
					{
						main.events.playStateChange('animation', 'loop');
						main.entering_slide = main.first_el;
					}
				}
				else
				{
					if (main.active_el[0] != main.first_el[0])
					{
						main.entering_slide = main.active_el.prev();
					}
					else
					{
						main.events.playStateChange('animation', 'loop');
						main.entering_slide = main.last_el;
					}
				}
			}
			
			if (main.entering_slide[0] == main.exiting_slide[0])
			{
				//return false;
				main.exiting_slide = {};
			}
			
			if (!main.entering_slide.length && !main.exiting_slide.length)
			{
				return false;
			}
			
			return true;
		}
		
		
		
		main.computePositioning = function(keyword, percentage_slide_distance)
		{
			var positioning = {
				'css': {},
				'ani': {}
			}
			
			if (main.runtime_params.nav_dir == 'right')
			{
				main.invertProps(keyword, true);
			}
			
			if (typeof percentage_slide_distance === 'undefined')
			{
				var percentage_slide_distance = main.runtime_params.percentage_slide_distance;
			}
			
			
			if (keyword.left)
			{
				positioning.css.left = 'auto';
				positioning.ani.right = percentage_slide_distance + '%';
			}
			else if (keyword.right)
			{
				positioning.css.right = 'auto';
				positioning.ani.left = percentage_slide_distance + '%';
			}
			
			if (keyword.top)
			{
				positioning.css.top = 'auto';
				positioning.ani.bottom = percentage_slide_distance + '%';
			}
			else if (keyword.bottom)
			{
				positioning.css.bottom = 'auto';
				positioning.ani.top = percentage_slide_distance + '%';
			}
			
			return positioning;
		}
	
	
		
		
		main.computeProperties = function()
		{
			// Property: position
			main.entering_slide._position = {};
			main.entering_slide._css3_ani = '';
			
			main.exiting_slide._position = {};
			main.exiting_slide._css3_ani = '';
			
			if (~$.inArray('slide', main.runtime_params.animation_fn))
			{
				if (~$.inArray('reflect', main.runtime_params.animation_fn))
				{
					main.runtime_params.animation_cast = ['entry', 'exit'];
				}
				
				if (~$.inArray('horizontal', main.runtime_params.animation_orientation))
				{
					if (~$.inArray('entry', main.runtime_params.animation_cast))
					{
						main.entering_slide._position.left = true;
					}
					if (~$.inArray('exit', main.runtime_params.animation_cast))
					{
						main.exiting_slide._position.right = true;
					}
				}
				if (~$.inArray('vertical', main.runtime_params.animation_orientation))
				{
					if (~$.inArray('entry', main.runtime_params.animation_cast))
					{
						main.entering_slide._position.top = true;
					}
					if (~$.inArray('exit', main.runtime_params.animation_cast))
					{
						main.exiting_slide._position.bottom = true;
					}
				}
				
				// Bounce will behave like Displacement, so we need to inverse one of its directions
				if (~$.inArray('reflect', main.runtime_params.animation_fn))
				{
					var rand = Math.floor(Math.random() * 2);
					var random_position_property = Object.keys(main.exiting_slide._position)[rand];
					
					main.exiting_slide._position[random_position_property] = false;
					main.exiting_slide._position[main.getInverse(random_position_property)] = true;
				}/**/
			}
				
			// ---------
			main.entering_slide._position = main.computePositioning(main.entering_slide._position);
			main.exiting_slide._position = main.computePositioning(main.exiting_slide._position);
			
			// Other Effects
			// Property: Opacity
			
			if (~$.inArray('fade', main.runtime_params.animation_fn))
			{
				main.entering_slide._fade = {};
				main.exiting_slide._fade = {};
				
				if (~$.inArray('entry', main.runtime_params.animation_cast))
				{
					main.entering_slide._fade.opacity = main.runtime_params.numeric_fade_amount;
				}
				if (~$.inArray('exit', main.runtime_params.animation_cast))
				{
					main.exiting_slide._fade.opacity = main.runtime_params.numeric_fade_amount;
				}
			}
			
			// Property: Zooming
			
			if (~$.inArray('zoomin', main.runtime_params.animation_fn) || ~$.inArray('zoomout', main.runtime_params.animation_fn))
			{
				// ------------------------------------------------------------
				
				var entering_css3_ani = ~$.inArray('zoomout', main.runtime_params.animation_fn) ? 'zoomout' : 'zoomin';
				if (main.runtime_params.nav_dir == 'left')
				{
					entering_css3_ani = 'zoom' + main.getInverse(entering_css3_ani.replace('zoom', ''));
				}
				
				// ------------------------------------------------------------
				
				// If entry_class is zoomout to normal size, exit_class should be zoomout from normal size
				// which is achieved by zoomin to normal in reverse
				var exiting_css3_ani = 'zoom' + main.getInverse(entering_css3_ani.replace('zoom', ''));
				if (~$.inArray('reflect', main.runtime_params.animation_fn))
				{
					// Then its simply the same as entry_class but to be reversed
					exiting_css3_ani = entering_css3_ani;
				}
				
				// Exit must be reverse of whatever was concluded above
				if (~$.inArray('entry', main.runtime_params.animation_cast))
				{
					main.entering_slide._css3_ani = entering_css3_ani;
				}
				
				if (~$.inArray('exit', main.runtime_params.animation_cast))
				{
					main.exiting_slide._css3_ani = exiting_css3_ani + ' animation-reverse';
				}
			}
			
			
			if (!~$.inArray('entry', main.runtime_params.animation_cast))
			{
				main.entering_slide.attr('data-order', 'rare');
				if (main.exiting_slide.length)
				{
					main.exiting_slide.attr('data-order', 'fore');
				}
			}
			else
			{
				main.entering_slide.attr('data-order', 'fore');
				if (main.exiting_slide.length)
				{
					main.exiting_slide.attr('data-order', 'rare');
				}
			}
		}
		
		
		
		// BUNDLED_EXTRAS
		// ------------------------------------------------------------
		main.initialized = function()
		{
			if (main.runtime_params.auto_adjust_container_height)
			{
				main.entering_slide.css('height', 'auto').css('bottom', 'auto');
				
				main.presentation
				.addClass('_auto_height_adjust')
				.animate({
					height: main.entering_slide.outerHeight()
				},
				{
					duration: main.runtime_params.animation_duration,
					specialEasing: main.runtime_params.easing
				});
				
				main.entering_slide.css('height', 'jargons').css('bottom', 'jargons');
			}
		}
		// ----------------------------------------------------------------------------
			

		main.beforeAnimation = function()
		{
			// on_animation event
			main.events.playStateChange('animation', 'started');
			
			main.events.stateChange('entering_slide', 'activating');
			if (main.exiting_slide.length)
			{
				main.events.stateChange('exiting_slide', 'deactivating');
			}
		}
		
		main.afterAnimation = function()
		{
			// on_animation event
			main.events.playStateChange('animation', 'completed');
			
			main.events.stateChange('entering_slide', 'active');
			if (main.exiting_slide.length)
			{
				main.events.stateChange('exiting_slide', 'inactive');
			}
		}
		
		
	

		main.doAnimation = function(entering_el_index)
		{
			if (main.slide_elements.is(':animated'))
			{
				return;
			}
			
			if (!main.setCast(entering_el_index))
			{
				return;
			}
			
			main.computeProperties();
			
			main.beforeAnimation();
						
			// 1. Entry Element
			
			var entering_props = $.extend({},
			//properties_reset,
			// Override default values with whatever has been computed
			main.entering_slide._position.css,
			main.entering_slide._position.ani,
			main.entering_slide._fade,
			{
				// A value that should have no effect on element
				// Here to ensure at least one property for animation to work
				marginLeft: 0
			});
			
			main.entering_slide
			// Set element to initial state using css
			.css(entering_props);
			
			// ----------------------------------------------------------
			// Start ani css3 animations
			if (main.entering_slide._css3_ani)
			{
				main.entering_slide.addClass(main.entering_slide._css3_ani);
			}
			if (main.params.additional_classes)
			{
				main.entering_slide.addClass(main.params.additional_classes);
			}
			// ----------------------------------------------------------
			
			// Animate element to Final state (all properties reset to default)
			main.entering_slide.clearQueue()
			.animate(main.properties_reset,
			{
				duration: main.runtime_params.animation_duration,
				specialEasing: main.runtime_params.easing,
				complete: function()
				{
					if (main.entering_slide._css3_ani)
					{
						main.entering_slide.removeClass(main.entering_slide._css3_ani);
					}
					if (main.params.additional_classes)
					{
						main.entering_slide.removeClass(main.params.additional_classes);
					}
					
					// By the time this callback is called, the exiting animation is also completing
					// Callback is called here whether or not there is exiting slide... which can happen at startup
					main.afterAnimation();
				}
			});
			
			
			
			
			// 2. Exit Element
			

			
			if (!main.exiting_slide.length)
			{
				return;
			}
			
			var exiting_props = $.extend({},
			main.exiting_slide._position.ani,
			main.exiting_slide._fade,
			{
				// A value that should have no effect on element
				// Here to ensure at least one property for animation to work 
				marginLeft: 0
			});
			
			main.exiting_slide
			// Use css to set left/right, top/bottom to auto
			.css(main.exiting_slide._position.css);
			// ----------------------------------------------------------
			// Start ani css3 animations
			if (main.exiting_slide._css3_ani)
			{
				main.exiting_slide.addClass(main.exiting_slide._css3_ani);
			}
			if (main.params.additional_classes)
			{
				main.exiting_slide.addClass(main.params.additional_classes);
			}
			// ----------------------------------------------------------

			// Animate element to final value (out of view)
			main.exiting_slide.clearQueue()
			.animate(exiting_props,
			{
				duration: main.runtime_params.animation_duration,
				specialEasing: main.runtime_params.easing,
				complete: function()
				{
					main.exiting_slide
					.css(main.properties_reset);
					
					if (main.exiting_slide._css3_ani)
					{
						main.exiting_slide.removeClass(main.exiting_slide._css3_ani);
					}
					if (main.params.additional_classes)
					{
						main.exiting_slide.removeClass(main.params.additional_classes);
					}
				}
			});
		}
		
		
		
	
		//......................................................................................................................................................





		main.autoplay_start_timer = null;
	
		main.autoPlayStart = function()
		{
			if (main.runtime_params.auto_play)	
			{
				// Reset
				clearInterval(main.autoplay_start_timer);
				// New
				main.autoplay = 'started';
				main.events.playStateChange('autoplay', 'started');
				main.presentation
				.removeClass('auto-play-stop');
				main.autoplay_start_timer = setInterval(function()
				{
					main.doAnimation();
				}, main.runtime_params.auto_play_interval);
			}
		};
	
	
		main.autoPlayStop = function()
		{
			main.autoplay = 'stopped';
			main.events.playStateChange('autoplay', 'stopped');
			main.presentation
			.addClass('auto-play-stop');
			clearInterval(main.autoplay_start_timer);
		}
		
		
		// Autoplay button
		main.presentation.on('click', '[data-role="playpause"]', function(e)
		{
			if (main.autoplay == 'started')
			{
				main.autoPlayStop();
			}
			else
			{
				main.autoPlayStart();
			}
			
			e.preventDefault();
		})
			
		
		// Left/Right navs
		main.presentation.on('click', '[data-role="nav"][data-rel="left"], [data-role="nav"][data-rel="right"]', function()
		{
			main.autoPlayStop();
			
			main.runtime_params.nav_dir = $(this).attr('data-rel');
			main.doAnimation();
		})
		
		
		// Thumbnail navs
		main.presentation.on('click', '[data-role="nav"][href], [data-role="nav"][data-target]', function(e)
		{
			main.autoPlayStop();
			
			var target_id = $(this).attr('href') || $(this).attr('data-target');
			main.doAnimation(main.getIndexFromId(target_id)/*entering_el_index*/);

			e.preventDefault();
		})
			
		
		
		main.exec = function()
		{
			main.unique_id = 'slide-' + Date.now();
			
			// The slide elements inside oresentation container
			main.slide_elements = main.presentation.find(main.params.slide_elements_selector);
			// Give each element a unique number. We'll use the number to locate them
			main.slide_elements.each(function(i, el)
			{
				var el = $(el);
				el.attr('id', main.getIdFromIndex(i));
				
				if (main.params.thumbnails_container_selector)
				{
					var thumbnails_container_selector = main.presentation.find(main.params.thumbnails_container_selector);
					var num_thumbnails = thumbnails_container_selector.children('li').length;
					var last_thumbnail = $(thumbnails_container_selector.children('li')[num_thumbnails - 1]);
					if (num_thumbnails < i +1)
					{
						last_thumbnail = last_thumbnail.clone();
						thumbnails_container_selector.append(last_thumbnail);
					}
					
					last_thumbnail.find('a').attr('href', '#' + main.getIdFromIndex(i));
				}
				
				if (main.params.slidenav_container_selector)
				{
					var left = $('<a data-role="nav" data-rel="left"></a>');
					var right = $('<a data-role="nav" data-rel="right"></a>');
					var slidenav_container_selector = main.presentation.find(main.params.slidenav_container_selector);
					slidenav_container_selector.append(left).append(right);
				}
			})
			
			if (~$.inArray('zoomin', main.runtime_params.animation_fn) || ~$.inArray('zoomout', main.runtime_params.animation_fn))
			{
				// Sync transition duration betweeen js and css
				var dur = main.runtime_params.animation_duration + 'ms';
				var easing = Ox.fromCamelCase(main.runtime_params.easing, '-');
				main.slide_elements.css('-webkit-animation-duration', dur).css('animation-duration', dur);
				main.slide_elements.css('-webkit-animation-timing-function', easing).css('animation-timing-function', easing);
			}
			
			// First change
			main.runtime_params.nav_dir = 'right';
			
			main.first_el = $(main.slide_elements[0]);
			main.last_el = $(main.slide_elements[main.slide_elements.length - 1]);
			main.active_el = main.getActiveElement();
			
			main.properties_reset = {
				left: '0px',
				right: '0px',
				top: '0px',
				bottom: '0px',
				width: '100%',
				height: '100%',
				opacity: 1
			};
			
			main.entering_slide = main.active_el.length ? main.active_el : main.first_el;
			
			setTimeout(function()
			{
				// If it's currently hovered... at startup, stop
				if (!main.presentation.is(':hover'))
				{
					main.autoPlayStart();
				};
			}, main.runtime_params.start_auto_play_after);
			
			
			if (main.runtime_params.auto_play_pause_on_hover)	
			{
				//on mouseOver
				main.presentation.mouseenter(function()
				{
					main.autoPlayStop();
				});
				
				//on mouseOut
				main.presentation.mouseleave(function() 
				{
					main.autoPlayStart();
				});
			}
		
		
			
			// The initialized event
			main.initialized();
			if (typeof main.runtime_params.OnInitialize === 'string')
			{
				window[main.runtime_params.OnInitialize].call(main);
			}
			else if (typeof main.runtime_params.OnInitialize === 'function')
			{
				main.runtime_params.OnInitialize.call(main);
			}
		}
		
		main.exec();
	}
	
})(jQuery)

