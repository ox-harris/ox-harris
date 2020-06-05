// JavaScript Document
(function($) 
{
	$.fn.Overview = function(opts, use_attr_opts, force_exec)
	{
		/** 
		  * Loop thru each matched and call repective functions 
		  */
		return this.each(function(i, el)
		{
			new OverviewObject(el, opts, use_attr_opts, force_exec);
			//----------------------
		});
	}
	
	var OverviewObject = function(subject_element, opts, use_attr_opts, force_exec)
	{
		var main = this;
		
		main.params = {
			trigger: 'hover',
			control_toggle: true,
			
			type: 'tooltip',
			overview_element: '.overview',
			additional_classes: null,
			animate: 'out',
			overview_name: null,
			use_recurrence_preference: false,
			overview_timeout: null,
			event_namespace: 'overview.',
			
			header_content: null,
			main_content: null,
			footer_content: null,
			main_content_element: null,
			
			alignment: 'C,A,B',
			placement: 'A,B,C',
			axis: 'Y,X,Z',
			position_search_priority: ['axis', 'placement', 'alignment'],
			
			header_controls: false,
			footer_controls: false,
			auto_focus: true,
			kbd_keys: {enter:false, esc:'esc = exit', tab:false, up:false, down:false, left:false, right:false},
			
			arrow_ab_distance: 25,
			arrow_weight: 10,
			
			backdrop_subject: false,
			backdrop_noscroll: true,
			backdrop_type: 'backdrop',
			
			OnInitialize: null,	
			OnStateChange: null,	
			OnContentSet: null,	
		};
		
		main.use_attr_opts = use_attr_opts;
		main.subject_element = $(subject_element);
		
		$.extend(main.params, opts);
		main.initParams = function()
		{
			// Get params from element's attribute
			if (main.use_attr_opts !== false)
			{
				if (main.subject_element.attr('data-overview-params') && typeof Ox.parseProps !== 'undefined')
				{
					var el_params = Ox.parseProps(main.subject_element.attr('data-overview-params'));
					$.extend(main.params, el_params);
				}
			}
		};
		main.initParams();

		main.axis_priority = main.params.axis.toUpperCase().split(',');
		main.placement_priority = main.params.placement.toUpperCase().split(',');
		main.alignment_priority = main.params.alignment.toUpperCase().split(',');
		
		
		
		
		/* -----------------------------------
		 // <overview_element-triggers>: statechange {state: opening, opened, closing, closed}, contentset. 
		 <listens-to>: responsive-mode-change
		----------------------------------- */
		main.events = {
			contentSet: function()
			{
				// Callback
				if (typeof main.params.OnContentSet === 'string')
				{
					window[main.params.OnContentSet].call(main.subject_element, main.overview_element);
				}
				else if (typeof main.params.OnContentSet === 'function')
				{
					main.params.OnContentSet.call(main.subject_element, main.overview_element);
				}
				
				// Event
				main.overview_element.trigger(main.params.event_namespace + 'contentset');
			},
			stateChange: function(state)
			{
				var data = {state: state};
				if (state === 'closing' || state === 'closed')
				{
					data.closing_response = main.closing_response;
				}
				
				// Callback
				if (typeof main.params.OnStateChange === 'string')
				{
					window[main.params.OnStateChange].call(main.subject_element, data, main.overview_element);
				}
				else if (typeof main.params.OnStateChange === 'function')
				{
					main.params.OnStateChange.call(main.subject_element, data, main.overview_element);
				}
				
				// Event
				main.overview_element.trigger(main.params.event_namespace + 'statechange', data);
			}
		};
		// -----------------------------------
		
		
		
		
		
		main.initialize = function()
		{
			main.unique_id = 'overview-' + Date.now();
			
			// Save this before displaying overview element
			// Displaying it before gettin these values may give errors
			main.document_width = $(document).width();
			main.document_height = $(document).height();
			// Immediate parent may not be positioned
			main.subject_element_offset_parent = main.subject_element.offsetParent();
			
			// Subject element
			main.subject_element_dimension = {};
			main.subject_element_dimension.width = main.subject_element.outerWidth();
			main.subject_element_dimension.height = main.subject_element.outerHeight();
			
			var arrow_ab_distance_exact_middle = main.params.arrow_ab_distance + main.params.arrow_weight;
			if (main.subject_element_dimension.width / 2 < arrow_ab_distance_exact_middle)
			{
				main.subject_element_dimension.width_patch = arrow_ab_distance_exact_middle - (main.subject_element_dimension.width / 2);
			}
			if (main.subject_element_dimension.height / 2 < arrow_ab_distance_exact_middle)
			{
				main.subject_element_dimension.height_patch = arrow_ab_distance_exact_middle - (main.subject_element_dimension.height / 2);
			}
			
			main.subject_element_coords = {};
			
			// Distamce from viewport top to element top
			main.subject_element_coords.top_top = main.subject_element.offset().top - main.subject_element_offset_parent.offset().top;//main.subject_element.position().top
			// Distamce from viewport top to element bottom
			main.subject_element_coords.top_bottom = main.subject_element_coords.top_top + main.subject_element_dimension.height;
			// Distamce from viewport bottom to element top
			main.subject_element_coords.bottom_top = main.subject_element_offset_parent.outerHeight() - main.subject_element_coords.top_top;
			// Distamce from viewport bottom to element bottom
			main.subject_element_coords.bottom_bottom = main.subject_element_coords.bottom_top - main.subject_element_dimension.height;
			
			// Distamce from viewport left to element left
			main.subject_element_coords.left_left = main.subject_element.offset().left - main.subject_element_offset_parent.offset().left;//main.subject_element.position().left;
			// Distamce from viewport left to element right
			main.subject_element_coords.left_right = main.subject_element_coords.left_left + main.subject_element_dimension.width;
			// Distamce from viewport right to element left
			main.subject_element_coords.right_left = main.subject_element_offset_parent.outerWidth() - main.subject_element_coords.left_left;
			// Distamce from viewport right to element right
			main.subject_element_coords.right_right = main.subject_element_coords.right_left - main.subject_element_dimension.width;
			
			// Set flag
			main.initialized = true;
		}
		
		main.setOverviewElement = function()
		{
			// If we can't find the status element inside current element using the selector,
			// append the general overview_element close to the element
			if (!main.subject_element.attr('aria-describedby') || !$('#' + main.subject_element.attr('aria-describedby')).length)
			{
				// Bind subject to overview
				var overview_element = $($('body').children(main.params.overview_element + '[data-role="template"]'/* + '[data-type=' + main.params.type + ']'*/)[0]).clone().attr('id', main.unique_id).removeAttr('data-role');
				main.subject_element.attr('aria-describedby', main.unique_id);
				
				main.subject_element.after(overview_element);
				
				main.overview_auto_generated = true;
			}
			
			// The Pop View Element
			main.overview_element = $('#' + main.subject_element.attr('aria-describedby'));
			
			if (!main.overview_element.length)
			{
				return false;
			}
			
			if (main.params.additional_classes)
			{
				main.overview_element.addClass(main.params.additional_classes);
			}
			
			main.overview_arrow = main.overview_element.children('.overview-arrow');
			
			// Set the type... before we work with dimension later during positioning
			main.overview_element.attr('data-type', main.params.type);
			main.subject_element.attr('data-overview-type', main.params.type);
			
			main.header_content_element = main.overview_element.find('.overview-header > ._content');
			main.main_content_element = main.overview_element.find('.overview-main > ._content');
			main.footer_content_element = main.overview_element.find('.overview-footer > ._content');

			main.main_element = main.overview_element.find('.overview-main');
			
			return true;
		}
	
		main.createZlayer = function(as_true_modal)
		{
			// Find it globally... the one that belongs exactly to this overview.
			// Existing overviews must use their existing modal-layer and using main.unique_id to find associated modal-layer isn't perfect.
			// main.unique_id is generated whether or not subject already has an overview.
			main.z_layer = $('#modal-layer-'+ main.subject_element.attr('aria-describedby'));
			
			if (!main.z_layer.length)
			{
				main.z_layer = $('<div class="modal-layer pos-fxd flex-box opacity-0" id="modal-layer-'+ main.unique_id +'" tabindex="-1"></div>');
				
				if (!as_true_modal)
				{
					main.subject_element.before(main.z_layer);
					main.z_layer.addClass('light-' + main.params.backdrop_type);
				}
				else
				{
					// Send to a global scope
					// Wrap with layer
					$('body').append(main.z_layer.append(main.overview_element));

					main.z_layer.addClass(main.params.backdrop_type).focus();
					
					$('body').on('keydown', main.noBodyScrolling);
				}
				
				main.z_layer.on('dblclick', function(e)
				{
					// Don't respond to this event bubbling from child.
					if (e.currentTarget === e.target)
					{
						main.closeOverview();
					}
				});
				
				// Close on esc
				main.bindKbd(main.z_layer);
			}
		}
		
		main.removeZlayer = function(as_true_modal)
		{
			if (main.z_layer)
			{
				if (as_true_modal)
				{
					main.overview_element.unwrap();
				}
				
				$('body').off('keydown', main.noBodyScrolling);
					
				main.z_layer.remove();
				main.z_layer = null;
			}
		}
		
		main.noBodyScrolling = function(e)
		{
			if (main.params.backdrop_noscroll)
			{
				var e = e || event;
				if (e.keyCode == 37/*left*/ || e.keyCode == 38/*up*/ || e.keyCode == 39/*right*/ || e.keyCode == 40/*down*/)
				{
					main.flash(3);
					
					if (!main.overview_element.find(':focus').length && !main.z_layer.find(':focus').length)
					{
						main.overview_element.focus();
					}
					
					return false;
				}
			}
		}
		
		main.bindKbd = function(el)
		{
			el
			//.off('keydown')
			.on('keydown', function(e)
			{
				var e = e || event;

				if (
				(e.keyCode == 13 && main.params.kbd_keys.enter)// enter
				|| (e.keyCode == 27 && main.params.kbd_keys.esc)// esc
				|| (e.keyCode == 9 && main.params.kbd_keys.tab)// tab
				|| (e.keyCode == 37 && main.params.kbd_keys.left)// arrow left
				|| (e.keyCode == 38 && main.params.kbd_keys.up)// arrow up
				|| (e.keyCode == 39 && main.params.kbd_keys.right)// arrow right
				|| (e.keyCode == 40 && main.params.kbd_keys.down)// arrow down
				) 
				{
					if (e.keyCode == 9/*tab*/ && e.shiftKey)
					{
						main.closing_response = -9;
					}
					else
					{
						main.closing_response = e.keyCode;
					}
					
					main.closeOverview(true);
					return false;
				}
			});
		}
		


	
	
		main.flash = function(num)
		{
			if (num && main.z_layer)
			{
				if (!main.z_layer_default_background)
				{
					// Keep it globally and once
					main.z_layer_default_background = main.z_layer.css('background-color');
				}
				
				main.z_layer.css('background-color', 'rgba(0,0,0,0.125)');
				setTimeout(function()
				{
					main.z_layer.css('background-color', main.z_layer_default_background);
					setTimeout(function()
					{
						main.flash(num - 1);
					}, 100);
				}, 100);
			}
		}
	
	
		main.bindControls = function()
		{
			// Remove all current bindins, if any
			
			main.overview_element
			//.off('click', '[data-action=minimize]')
			.on('click', '[data-action="minimize"]', function()
			{
				main.minOverview();
			});
	
			main.overview_element
			//.off('click', '[data-action=maximize]')
			.on('click', '[data-action="maximize"]', function()
			{
				main.maxOverview();
			});
	
			main.overview_element
			//.off('click', '[data-action=close]')
			.on('click', '[data-action="close"]', function(e)
			{
				main.closing_response = $(this).attr('data-response');
				main.recurrence_preference = $(this).attr('data-recurrence-preference');
				main.closeOverview(true);
				
				e.preventDefault();
			});
			
			// Close on esc
			main.bindKbd(main.overview_element);
			
			// This event is defined in functions.js
			$(document).on('responsive-mode-change', function(e, responsive_mode)
			{
				// Recalculate subject element
				main.initialize();
				// Now reposition
				main.positionOverview();
			})
		}
		
		
		
		
		
		
		
		
		
		
		
		main.positionOverview = function()
		{
			if (!main.overview_element)
			{
				return;
			}
			
			// Overview element and arrow
			main.overview_element_dimension = {};
			main.overview_element_dimension.width = main.overview_element.outerWidth();
			main.overview_element_dimension.height = main.overview_element.outerHeight();
			
			main.setPreferedPosition();
			if (!main.validatePosition())
			{
				// Search for a suitable position
				main.current_priority_key = 0;
				var pos_search = main.searchPosition(main.params.position_search_priority[main.current_priority_key]);
				if (!pos_search)
				{
					// No better place found. We force it on the prefered place.
					//main.setPreferedPosition();
				}
			}
			
			main.setStatuses();
		}
		
		main.setPreferedPosition = function()
		{
			// Set position using the specified params
			if (main.axis_priority[0])
			{
				main.set_axis(main.axis_priority[0]);
			}
			if (main.placement_priority[0])
			{
				main.set_placement(main.placement_priority[0]);
			}
			if (main.alignment_priority[0])
			{
				main.set_alignment(main.alignment_priority[0]);
			}
		}
		
		main.validatePosition = function()
		{
			if (main.overview_element.offset().left < 0 
			|| main.overview_element.offset().top < 0
			|| main.overview_element.offset().left + main.overview_element.outerWidth() > main.document_width
			|| main.overview_element.offset().top + main.overview_element.outerHeight() > main.document_height)
			{
				return false;
			}
			
			return true;
		}
			
		main.set_alignment = function(value)
		{
			// Z axis is not handled here.
			if (main.axis === 'Z')
			{
				return;
			}
			
			main.alignment = value;
			
			var left_or_top = main.axis === 'X' ? 'top' : 'left';
			var right_or_bottom = main.axis === 'X' ? 'bottom' : 'right';
			var overview_width_or_height = main.axis === 'X' ? main.overview_element_dimension.height : main.overview_element_dimension.width;
			var subject_width_or_height_patch = main.axis === 'X' ? main.subject_element_dimension.height_patch : main.subject_element_dimension.width_patch;
			if (main.alignment == 'A' || main.alignment == 'B')
			{
				if (main.alignment == 'A')
				{
					main.alignment_decoded = left_or_top;
					main.overview_element.css(left_or_top, main.subject_element_coords[left_or_top + '_' + left_or_top/*left_left | top_top*/] - (subject_width_or_height_patch && main.placement != 'C' ? subject_width_or_height_patch : 0) + 'px').css(right_or_bottom, 'auto');
					main.overview_arrow.css(left_or_top, main.params.arrow_ab_distance + 'px').css(right_or_bottom, 'auto');
				}
				else// if (main.alignment == 'B')
				{
					main.alignment_decoded = right_or_bottom;
					main.overview_element.css(right_or_bottom, main.subject_element_coords[right_or_bottom + '_' + right_or_bottom/*right_right | bottom_bottom*/] - (subject_width_or_height_patch && main.placement != 'C' ? subject_width_or_height_patch : 0) + 'px').css(left_or_top, 'auto');
					main.overview_arrow.css(right_or_bottom, main.params.arrow_ab_distance + 'px').css(left_or_top, 'auto');
				}
			}
			else// if (main.alignment == 'C')
			{
				var subject_overview_width_or_height_diff = main.axis == 'X' ? main.subject_element_dimension.height - main.overview_element_dimension.height : main.subject_element_dimension.width - main.overview_element_dimension.width;
				main.overview_element.css(right_or_bottom, main.subject_element_coords[right_or_bottom + '_' + right_or_bottom/*right_right | bottom_bottom*/] + (subject_overview_width_or_height_diff / 2) + 'px').css(left_or_top, 'auto');
				
				main.overview_arrow.css(right_or_bottom, (overview_width_or_height / 2) - main.params.arrow_weight + 'px').css(left_or_top, 'auto');
			}
		}
		
		main.set_placement = function(value)
		{
			// Z axis is not handled here.
			if (main.axis === 'Z')
			{
				return;
			}
			
			main.placement = value;
			
			var left_or_top = main.axis === 'X' ? 'left' : 'top';
			var right_or_bottom = main.axis === 'X' ? 'right' : 'bottom';
			var overview_width_or_height = main.axis === 'X' ? main.overview_element_dimension.width : main.overview_element_dimension.height;
			if (main.placement == 'A' || main.placement == 'B')
			{
				if (main.placement == 'A')
				{
					main.placement_decoded = left_or_top;
					main.overview_arrow.css(left_or_top, '100%').css(right_or_bottom, 'auto');
					main.overview_element.css(right_or_bottom, main.subject_element_coords[right_or_bottom + '_' + left_or_top/*bottom_top | right_left*/] + main.params.arrow_weight + 'px').css(left_or_top, 'auto');
				}
				else// if (main.placement == 'B')
				{
					main.placement_decoded = right_or_bottom;
					main.overview_arrow.css(right_or_bottom, '100%').css(left_or_top, 'auto');
					main.overview_element.css(left_or_top, main.subject_element_coords[left_or_top + '_' + right_or_bottom/*top_bottom | left_right*/] + main.params.arrow_weight + 'px').css(right_or_bottom, 'auto');;
				}
			}
			else// if (main.placement == 'C')
			{
				var subject_overview_width_or_height_diff = main.axis == 'X' ? main.subject_element_dimension.width - main.overview_element_dimension.width :  main.subject_element_dimension.height - main.overview_element_dimension.height
				main.overview_element.css(right_or_bottom, main.subject_element_coords[right_or_bottom + '_' + right_or_bottom/*right_right | bottom_bottom*/] + (subject_overview_width_or_height_diff / 2) + 'px').css(left_or_top, 'auto');
				
				main.overview_arrow.css('display', 'none');
			}
		}
		
		main.set_axis = function(value)
		{
			main.axis = value;
			if (main.axis === 'Z')
			{
				// Unaffected by position searche values...
				// Z-Axis never searches for position... It uses absolute values.
				main.placement = main.placement_priority[0];
				main.alignment = main.alignment_priority[0];
				
				// Create layer element first
				main.createZlayer(true/*as_true_modal*/);
				
				// Placement
				var placement = main.placement == 'A' ? 'kids-algn-top' : main.placement == 'B' ? 'kids-algn-btm' : 'kids-algn-mdl';
				main.z_layer.addClass(placement);
				// Alignment
				var alignment = main.alignment == 'A' ? 'algn-lft' : main.alignment == 'B' ? 'algn-rt' : 'algn-cntr';
				main.z_layer.addClass(alignment);
				
				main.overview_element
				.css('left', 'auto')
				.css('right', 'auto')
				.css('top', 'auto')
				.css('bottom', 'auto');
			}
		}
		
		main.searchPosition = function(position_param)
		{
			for (var i = 0; i < main[position_param + '_priority'].length; i ++)
			{
				var value = main[position_param + '_priority'][i];
				// Effect this param. i.e. main.set_axis('X');
				main['set_' + position_param](value);
				
				if (main.validatePosition())
				{
					// Position validated
					return true;
				}
				
				// Call the next subloop
				main.current_priority_key ++;
				if (typeof main.params.position_search_priority[main.current_priority_key] !== 'undefined')
				{
					var pos_search = main.searchPosition(main.params.position_search_priority[main.current_priority_key]);
					if (pos_search)
					{
						return true;
					}
				}
				main.current_priority_key --;
			}
			
			return false;
		}
		
		
		main.getInverse = function(param)
		{
			param = param == 'left' ? 'right' : (param == 'right' ? 'left' : param);
			param = param == 'top' ? 'bottom' : (param == 'bottom' ? 'top' : param);
			return param;
		}
		
		
		main.setAnimation = function(is_exit)
		{
			//if (main.params.animate)
			{
				if (main.placement_decoded || main.alignment_decoded)
				{
					// Axis is X or Y
					placement = main.placement_decoded ? main.placement_decoded : main.alignment_decoded /* Then placement is C */; 
					var animation = 'fly-' + placement + '50' + (is_exit ? ' animation-reverse' : '');;
					var animation_inverse = 'fly-' + placement + '50' + (is_exit ? '' : ' animation-reverse');;
				}
				else
				{
					// Axis is Z
					var animation = 'zoomin50' + (is_exit ? ' animation-reverse' : '');
					var animation_inverse = 'zoomin50' + (is_exit ? '' : ' animation-reverse');
				}
				
				main.overview_element.removeClass(animation_inverse);
				setTimeout(function()
				{
					main.overview_element.addClass(animation);
				}, 5);
			}
		}
		
		
		
		
		
		
		
		
		
		
		
		main.minOverview = function()
		{
			main.main_element_state = 'minimizing';
			main.events.stateChange('minimizing');
			
			if (!main.main_element_default_max_height)
			{
				// Keep it globally and once
				main.main_element_default_max_height = main.main_element.css('max-height');
			}
			
			// Save this for later use by maxOverview()
			main.main_element_approx_height = main.main_element.height();
			main.main_element.css('max-height', main.main_element_approx_height + 'px');
			
			main.main_element.animate(
			{
				maxHeight: '0px'
			}, 200, function()
			{
				main.main_element_state = 'minimized';
				main.events.stateChange('minimized');

				main.setStatuses();
			});
		}
		
		main.maxOverview = function()
		{
			main.main_element_state = 'maximizing';
			main.events.stateChange('maximizing');
			
			main.main_element.animate(
			{
				maxHeight: main.main_element_approx_height + 'px'
			}, 200, function()
			{
				main.main_element.css('max-height', parseInt(main.main_element_default_max_height) || 'none');
				
				main.main_element_state = 'maximized';
				main.events.stateChange('maximized');
			
				main.setStatuses();
			});
		}
		
		main.closeOverview = function(force_close)
		{
			// This delay is needed 
			// in case user is moving mouse to hover on overview
			setTimeout(function()
			{
				if (!main.overview_element)
				{
					return;
				}
				
				// Respond to the hover case above
				if (!main.overview_element.is(':hover') || force_close)
				{
					// Let's close
					if (main.state === 'opened' || force_close)
					{
						// Inform closing state while delay runs
						main.state = 'closing'
						main.events.stateChange('closing');
						
						// Prepare remove backdrop
						if (main.z_layer)
						{
							main.z_layer.animate(
							{
								opacity: 0
							}, 400);
						}
						
						// Start shifting
						main.setAnimation(true/*is_exit*/);
					
						// Hide overview element
						main.overview_element
						.clearQueue()
						.animate(
						{
							opacity: 0 // main.setAnimation() has its own opacity
						}, 400, function()
						{
							if (main.overview_element)
							{
								// Finally remove z-layer
								if (main.z_layer)
								{
									main.removeZlayer(main.params.backdrop_subject ? false : true/*as_true_modal*/);
								}
								
								// Flag and event better set here.
								// main.overview_element may be null in the next block.
								main.state = 'closed';
								main.events.stateChange('closed');
								
								if (main.overview_auto_generated)
								{
									main.subject_element.removeAttr('aria-describedby');
									main.overview_element.remove();
									main.overview_element = null;
								}
								else
								{
									main.overview_element.css('display', 'none');
								}
								
								// Save closing response	
								if (main.params.use_recurrence_preference && main.Storage)
								{
									// If a closing button that has attr('data-recurrence-preference') was clicked, main.recurrence_preference will be set
									var recurrence_preference = main.recurrence_preference ? main.recurrence_preference : main.params.use_recurrence_preference;
									main.Storage.setVal(recurrence_preference).setToLocal();
								}
							}
						});
					}
				}
				else
				{
					main.overview_element.off('mouseleave')
					.on('mouseleave', function()
					{
						main.closeOverview(true);
					})
				}
			}, 150);
		}
		
		
		main.openOverview = function(force_open)
		{
			if (!main.state || main.state === 'closed' || force_open)
			{

				// Initialize only once
				//if (!main.initialized)
				{
					main.initialize();
				}
				
				// Duplication problems without this check
				if (!main.overview_element && main.setOverviewElement())
				{
					// Set flag
					main.state = 'opening';
					main.events.stateChange('opening');
					
					main.bindControls();
					main.overview_element.css('display', 'inline-block').css('opacity', 0);
					main.setContent();
					main.positionOverview();
					
					// Prepare backdrop
					if (main.params.backdrop_subject)
					{
						// Create layer element first
						main.createZlayer(false/*as_true_modal*/);
					}
					
					// Finally show backdrop
					if (main.z_layer)
					{
						main.z_layer.animate(
						{
							opacity: 1
						}, 400);
					}
					
					// Start shifting
					main.setAnimation();
					
					// Show overview element
					main.overview_element
					.clearQueue()
					.animate(
					{
						opacity: 1
					}, 400, function()
					{
						main.state = 'opened';
						main.events.stateChange('opened');

						if (main.params.auto_focus)
						{
							main.overview_element.focus();
						}
					})
					
					// Auto close
					if (main.params.overview_timeout)
					{
						setTimeout(function()
						{
							main.closeOverview();
						}, main.params.overview_timeout);
					}
				}
			}
		}
		
		
		
		
		
		
		
		
		
		
		
		// Place HTML content on element
		main.setContent = function()
		{
			// Header
			if (main.params.header_content)
			{
				main.header_content_element.html(main.params.header_content);
			}
			
			// Main
			if (main.params.main_content)
			{
				main.main_content_element.html(main.params.main_content);
			}
			
			if (main.params.main_content_element && $(main.params.main_content_element).length)
			{
				main.main_content_element.append($(main.params.main_content_element).html());
			}
			
			// Footer
			if (main.params.footer_content)
			{
				main.footer_content_element.html(main.params.footer_content);
			}
			
			if (main.params.use_recurrence_preference)
			{
				if (!main.footer_content_element.find('[data-action="close"][data-recurrence-preference]').length)
				{
					var response_cntrls = main.footer_content_element.clone().html('');
					
					response_cntrls.append(
						'<a data-action="close" data-recurrence-preference="next-session" href="javascript:void(0)"><span class="fa"></span> Show next time</a>'
					);
					response_cntrls.append(
						'<a data-action="close" data-recurrence-preference="never-again" href="javascript:void(0)"><span class="fa"></span> Don\'t show again</a>'
					);
					
					main.footer_content_element.before(response_cntrls);
					
					main.overview_element.find(
						'[data-action="close"][data-recurrence-preference="' + main.params.use_recurrence_preference + '"] .fa'
					)
					.addClass('fa-check-square');
				}
			}
				
			if (main.params.kbd_keys && main.params.footer_controls)
			{
				var kbd_shortcuts = null;
				$.each(main.params.kbd_keys, function(key, val)
				{
					if (val)
					{
						kbd_shortcuts = kbd_shortcuts ? kbd_shortcuts : $('<span class="keyboard-shortcuts kids-display-in-block kids-animation-delay-1"></span>');
						kbd_shortcuts.append(
							'<span class="opacity-0 fly-right" title="' + val + '">' + /*Ox.toCamelCase(*/key/*)*/ + '</span>'
						);
					}
				})
				
				if (kbd_shortcuts && !main.footer_content_element.find('.keyboard-shortcuts').length)
				{
					// Create a little close button as the last thing
					kbd_shortcuts.append(
						'<span><a class="cursor-pointer ico icon-cancel rtl-subject-icon" data-action="close" title="Close"></a></span>'
					);
					
					main.footer_content_element.append(kbd_shortcuts);
				}
			}
			
			// Callback
			main.events.contentSet();
		}
		
		main.setStatuses = function(opened)
		{
			if (main.overview_element)
			{
				if (!main.params.header_controls || main.axis !== 'Z')
				{
					// Should only appear when explicitly set or when axis is Z
					main.overview_element.find('.header-controls').remove();
				}
				
				main.overview_element.attr('data-main-state', main.main_element_state);
				main.overview_element.attr('data-state', main.state);
	
				main.overview_element.attr('data-axis', main.axis);
				main.overview_element.attr('data-placement', main.placement);
				main.overview_element.attr('data-alignment', main.alignment);
			}
			
			main.subject_element.attr('data-overview-main-state', main.main_element_state);
			main.subject_element.attr('data-overview-state', main.state);
			
			main.subject_element.attr('data-overview-axis', main.axis);
			main.subject_element.attr('data-overview-placement', main.placement);
			main.subject_element.attr('data-overview-alignment', main.alignment);
			
			// Blend arrow color to with that of main content background
			if (main.axis === 'X' && main.alignment === 'C' && main.main_content_element.css('background-color'))
			{
				var arrow_color = main.main_content_element.css('background-color');
			}
			else if (main.axis === 'Y' && main.placement === 'A' && main.footer_content_element.css('background-color'))
			{
				var arrow_color = main.footer_content_element.css('background-color');
			}
			else if (main.axis === 'Y' && main.placement === 'B' && main.header_content_element.css('background-color'))
			{
				var arrow_color = main.header_content_element.css('background-color');
			}
			
			if (arrow_color && arrow_color.replace(/ /g, '')/*replace spaces*/ !== 'rgba(0,0,0,0)')
			{
				main.overview_arrow.css('border-color', arrow_color);
			}
			else
			{
				main.overview_arrow.css('border-color', 'white');
			}
		}
		
		
		
		
	
		
		main.execOverview = function(force_exec)
		{
			if (main.params.use_recurrence_preference && main.params.overview_name)
			{
				main.Storage = Ox.Storage('Overviews', main.params.overview_name);
				// Lets talk about persistence
				main.Overview_session = main.Storage.getFromSession();
				main.Overview_persistent = main.Storage.getFromLocal();
				if (main.Overview_persistent)
				{
					// This Overview has come up before
					if (main.Overview_persistent == 'next-session' && main.Overview_session)
					{
						// Was deferred in this session. Don't show until next session
						if (!force_exec)
						{
							return false;
						}
					}
					else if (main.Overview_persistent == 'never-again')
					{
						// Don't even show again at all
						if (!force_exec)
						{
							return false;
						}
					}
				}
				
				// If we reach this point, we're good to go
				main.show_time = Date.now();
				main.Storage.setVal(main.show_time).setToSession();
			}
			
			// ---------------------------------------------------------
			var trigger = function(e, true_state)
			{
				if (e.type == 'mouseleave')
				{
					main.close_delay = 150;
				}
				
				if (e && e.type)
				{
					main.user_initiated = true;
				}
				
				if (true_state !== false)
				{
					if (main.state !== 'opened')
					{
						main.openOverview()
					}
					else if (main.params.control_toggle)
					{
						main.closeOverview();
					}
				}
				else
				{
					if (main.state == 'opened')
					{
						main.closeOverview();
					}
				}
			}
			
			main.subject_element.attachTrigger(main.params.trigger, trigger);
			// ---------------------------------------------------------
		}
		
		// The initialized event
		if (typeof main.params.OnInitialize === 'string')
		{
			window[main.params.OnInitialize].call(main);
		}
		else if (typeof main.params.OnInitialize === 'function')
		{
			main.params.OnInitialize.call(main);
		}
		
		main.execOverview(force_exec);			
	}
})(jQuery);
