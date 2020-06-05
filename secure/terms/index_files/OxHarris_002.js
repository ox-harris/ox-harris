// JavaScript Document
(function($)
{
	$.fn.InteractiveReq = function(opts, use_attr_opts)
	{
		/** 
		  * Loop thru each matched and call repective functions 
		  */
		return this.each(function(i, el)
		{
			new InteractiveReqObject(el, opts, use_attr_opts);
			//----------------------
		});
	};
	
	var InteractiveReqObject = function(element, opts, use_attr_opts)
	{
		var main = this;
	
		main.params = {
			trigger: 0,

			url: null,
			data: null,
			
			waiting_msg: 'Requesting',
			retrying_msg: 'Retrying',
			error_timeout: null,
			success_timeout: 1200,
			show_status: true,
			add_progress_bar: false,
			gif_type: 'anim',
			status_placement: 'mdl',
			
			ajax_process_element: '.ajax-process',			
			ajax_external_process_url: null,
			
			additional_classes: null,
			
			result_extract: null,
			result_extract2: '#page-content-main',
			result_update: null, //'#page-content-main',
			
			insert_fn: 'replace', //self_replace,replace,before,after
			animate_insert: true,
			
			parse_response_element: '.notices ._notice',
			parse_response_scripts: true,
			browser_pushstate: false,
			
			allow_inpage_req: false,
			cacheable: false,
			type: 'GET',
			async: true,
			event_namespace: 'interactivereq.',
			
			OnInitialize: null,
			OnStatusChange: null,
			OnProgress: false,
			OnContentLoaded: null,
		};
		
		main.element = $(element);
		main.use_attr_opts = use_attr_opts;
		main.ongoing_request = null;	
		
		$.extend(main.params, opts);
		main.initParams = function()
		{
			// Get params from element's attribute
			if (main.use_attr_opts !== false)
			{
				if (main.element.attr('data-interactivereq-params') && typeof Ox.parseProps !== 'undefined')
				{
					var el_params = Ox.parseProps(main.element.attr('data-interactivereq-params'));
					$.extend(main.params, el_params);
				}
			}
		};
		
		main.initParams();
		main.url = main.params.url;
		main.data = main.params.data;
		
		/* -----------------------------------
		<triggers>: statuschange {status: started <also listens-to>, waiting, retrying, error, success, completed}, contentloaded. 
		<listens-to>: abort
		-------------------------------------*/
		main.events = {
			contentLoaded: function()
			{
				// Callback
				if (typeof main.params.OnContentLoaded === 'string')
				{
					window[main.params.OnContentLoaded].call(main.element, main.ajax_process_element);
				}
				else if (typeof main.params.OnContentLoaded === 'function')
				{
					main.params.OnContentLoaded.call(main.element, main.ajax_process_element);
				}
				
				if (main.update_element && main.params.animate_insert)
				{
					/*
					$('html, body').animate(
					{
						scrollTop: main.update_element.offset().top + 'px'
					}, 6000);
					*/
					main.update_element.get(0).scrollIntoView();//
				}
				
				// Event
				main.element.trigger(main.params.event_namespace + 'contentloaded');
			},
			statusChange: function(status, message)
			{
				var data = {status: status.toLowerCase(), message: message};
				
				// Callback
				if (typeof main.params.OnStatusChange === 'string')
				{
					window[main.params.OnStatusChange].call(main.element, data, main.ajax_process_element);
				}
				else if (typeof main.params.OnStatusChange === 'function')
				{
					main.params.OnStatusChange.call(main.element, data, main.ajax_process_element);
				}
				
				// Event
				main.element.trigger(main.params.event_namespace + 'statuschange', data);
			}
		};
		// -----------------------------------
		
		
		
		
		
		if (main.params.show_status && main.params.ajax_process_element)
		{
			// If we can't find the status element inside current element using the selector,
			// append the general status element to the element
			if (!main.element.children(main.params.ajax_process_element).length)
			{
				main.element.append($($('body').children(main.params.ajax_process_element + '[data-role="template"]')[0]).clone().removeAttr('data-role'));
			}
			
			main.ajax_process_element = main.element.find(main.params.ajax_process_element);
			
			if (main.params.status_placement)
			{
				main.ajax_process_element.removeClass('kids-algn-mdl').addClass('kids-algn-' + main.params.status_placement);
			}
			
			if (main.params.additional_classes)
			{
				var classes = main.params.additional_classes;
				if (~classes.indexOf('kids-algn-top') || ~classes.indexOf('kids-algn-mdl') || ~classes.indexOf('kids-algn-btm'))
				{
					main.ajax_process_element.removeClass('kids-algn-top kids-algn-mdl kids-algn-btm');
				}
				
				main.ajax_process_element.addClass(classes);
			}
			
			main.ajax_process_element_status = main.ajax_process_element.find('._status');
			main.ajax_process_element_controls = main.ajax_process_element.find('._controls');
			main.ajax_process_content_element = main.ajax_process_element.find('._content');
			main.ajax_process_progress_element = main.ajax_process_element.find('._progress');
			main.ajax_process_progress_bar_element = main.ajax_process_element.find('._progress-bar');
			if (main.params.add_progress_bar)
			{
				main.ajax_process_element.find('._container').addClass('algn-lft');
				main.ajax_process_content_element.addClass('col-11 rspnsv-lg-col-10');
				main.ajax_process_progress_element.addClass('col-1 rspnsv-lg-col-2');
			}
			if (main.params.gif_type)
			{
				main.ajax_process_progress_element.attr('data-gif-type', main.params.gif_type);
			}
			
			if (main.ajax_process_element_controls.length)
			{
				main.ajax_process_element.attr("data-ajax-can-abort", 'true').attr("data-ajax-can-retry", 'true');
			}
		}
	
		if (main.params.result_update && $(main.params.result_update).length/*in this document*/)
		{
			main.update_element = $(main.params.result_update);
		}

		main.bindControls = function()
		{
			if (main.ajax_process_element)
			{
				main.ajax_process_element.click(function(e)
				{
					// In case it was from with an 'a' element
					return false;
				});
			}
			
			if (main.ajax_process_element_controls)
			{
				// Remove all current bindins, if any
				
				main.ajax_process_element
				.off('click', '[data-action="abort"]')
				.on('click', '[data-action="abort"]', function(e)
				{
					main.throwError("Request Cancelled!");
					
					// In case it was from with an 'a' element
					e.preventDefault();
				});
	
				// Make a whole new interactive request with all the parameters used to run this current one
				main.ajax_process_element
				.off('click', '[data-action="retry"]')
				.on('click', '[data-action="retry"]', function(e)
				{
					main.makeRequest(true/*is_retrying*/);
					
					// In case it was from with an 'a' element
					e.preventDefault();
				});
	
				main.ajax_process_element
				.off('click', '[data-action="exit"]')
				.on('click', '[data-action="exit"]', function(e)
				{
					main.removeStatus(true/*exit*/);
					
					// In case it was from with an 'a' element
					e.preventDefault();
				});
			}
			
			
			main.element
			.off('keydown', main.escKey)
			.on('keydown', main.keys);
			
			// We listen to the interactive-req-abort event and abort our own
			main.element
			.off(main.params.event_namespace + 'abort')
			.on(main.params.event_namespace + 'abort', function()
			{
				main.abortRequest();
			});
		}
			
		
		main.keys = function(e)
		{
			//var e = e || event;
			if (e.keyCode == 27/*esc*/) 
			{
				if (main.isRequesting())
				{
					main.throwError("Request Cancelled!");

				}
				else
				{
					main.removeStatus(true);
				}
			}
			else if (e.keyCode == 13/*enter*/) 
			{
				if (main.ongoing_request && !main.isRequesting())
				{
					main.makeRequest(true/*is_retrying*/);
				}
			}
		}
		
		
		
		
		
		
	
		// Show status on element and ajax-process element
		main.setStatus = function(type, message, timed_dismiss)
		{
			// Fire event
			main.events.statusChange(type, message);
			
			if (main.ajax_process_element && main.ajax_process_element.length)
			{
				// Set attributes
				main.ajax_process_element.attr('data-ajax-status-type', type).attr('title', message);
				main.ajax_process_element_status.html(message);
				
				main.ajax_process_element.animate({opacity: 1}, 800, function()
				{
				});
				
				// Arrange animation and status text horizontally
				if (main.element.height() < 85)
				{
					main.ajax_process_element.addClass('_horz');
				}
				else
				{
					main.ajax_process_element.removeClass('_horz');
				}
			}
			
			if (timed_dismiss > 0)
			{
				setTimeout(function()
				{
					main.removeStatus(true/*exit*/);
				}, timed_dismiss);
			}
		}
		
		// Set status on element and ajax-process element
		main.removeStatus = function(exit)
		{
			if (main.ajax_process_element && main.ajax_process_element.length)
			{
				main.ajax_process_element.animate({opacity: 0}, 800, function()
				{
					main.ajax_process_element.removeAttr("data-ajax-status-type");
					
					if (typeof exit !== 'undefined' && exit)
					{
						main.ajax_process_element.remove();
					}
				});
			}
		}
		
		// Set success status and call success callback
		main.throwSuccess = function(message)
		{
			main.setStatus('success', message, main.params.success_timeout);
		}
		
		// Set error status and call error callback
		main.throwError = function(message)
		{
			// Cancel any ongoing requests of this call
			main.abortRequest();
			main.setStatus('error', message, main.params.error_timeout);
		}	
		
		// Set a waiting status and call waiting callback
		main.showWaiting = function(message)
		{
			main.setStatus('waiting', message);
		}	
		
		// Set a retry status and call retry callback
		main.showRetry = function(message)
		{
			main.setStatus('retrying', message);
		}	
		
		// Show the percentage amount of progress from the current request
		main.showProgress = function(loaded, total, is_download)
		{
			if (total)
			{
				//main.ajax_process_element.find('._progress ._count').html(Math.round(loaded / total * 100) + '%');
			}
			if (typeof main.params.OnProgress === 'function')
			{
				main.params.OnProgress.call(this, loaded, total);
			}
			else if (typeof main.params.OnProgress === 'string')
			{
				window[main.params.OnProgress].call(this, loaded, total);
			}
		}
		
		// Show the percentage amount of progress from a separate url
		main.showProgressExternal = function()
		{
			if (!main.params.ajax_external_process_url || !main.ajax_process_progress_bar_element.length)
			{
				return;
			}

			if (main.isRequesting(main.ongoing_progress_request))
			{
				main.abortRequest(main.ongoing_progress_request);
			}
			
			setTimeout(function()
			{
				main.ongoing_progress_request = $.ajax({
				url: main.params.ajax_external_process_url,
				type: "post",
				success: function(response)
				{
					var completed = false;
					
					main.ajax_process_element.find('._substatus').removeClass('display-none');
					main.ajax_process_progress_bar_element.removeClass('display-none');
							
					if (response.substr(0, 1) == '{')
					{
						var json_response = JSON.parse(response);
						if (json_response && (json_response.total || json_response.status || json_response.substatus))
						{
							var total = parseInt(json_response.total);
							var loaded = parseInt(json_response.loaded);						

							main.ajax_process_element.find('._status').html(json_response.status);
							main.ajax_process_element.find('._substatus').html(json_response.substatus);
							var percentage = Math.round(loaded / total * 100);
							main.ajax_process_progress_element.find('._count').html((!isNaN(percentage) ? percentage : 0) + '%');
							main.ajax_process_progress_bar_element.find('progress').attr('value', loaded).attr('max', total);
							
							if (json_response.done)
							{
								completed = true;
							}
						}
					}
					
					// LOOP
					if (!completed)
					{
						main.showProgressExternal();
					}
				},
				error: function(errcode, errmsg)
				{
					console.log(errmsg);
				}
				});
			}, 600);
		}
		
		
		
		
		
		
		
		main.animateInsert = function(element, initial_height)
		{
			var preset_max_height = element.css('max-height');
			var preset_min_height = element.css('min-height');
			var preset_overflow = element.css('overflow');
			
			// Where animation emds
			var final_height = element.outerHeight();
			if (main.params.animate_insert && final_height != initial_height)
			{
				if (final_height > initial_height)
				{
					var prop_initial = {maxHeight: initial_height};
					var prop_final = {maxHeight: final_height};
				}
				else
				{
					var prop_initial = {minHeight: initial_height};
					var prop_final = {minHeight: final_height};
				}

				element
				.css(prop_initial).css('overflow', 'hidden')
				.animate(prop_final, 800, function()
				{
					// Return back to original
					element.css('max-height', 'none'/*preset_max_height*/).css('min-height', 'auto'/*preset_min_height*/).css('overflow', preset_overflow);
				});
			}
		}
		
		
		
		
		
		// Place HTML content on element
		main.setContent = function(callback)
		{
			if (main.update_content)
			{
				// Where animation starts
				// Do this before insert content
				var update_element_initial_height = main.update_element.outerHeight();
				// Now set content
				main.update_element.html(main.update_content.html());
				if (main.params.animate_insert)
				{
					main.animateInsert(main.update_element, update_element_initial_height);
				}
			}
			
			if (main.insert_content)
			{
				// Where animation starts
				// Do this before insert content
				var element_initial_height = main.element.height();
				if (main.params.insert_fn == 'self_replace')
				{
					// main.element must still be avilable
					main.element = main.element.replaceWith(main.insert_content.append(main.ajax_process_element));
				}
				else if (main.params.insert_fn == 'replace')
				{
					if (main.ajax_process_element && main.ajax_process_element.length)
					{
						// Leave status... so it can be changed by another handler
						main.element.children(':not(' + main.params.ajax_process_element + ')').remove();
						// Now set content
						main.ajax_process_element.before(main.insert_content);
					}
					else
					{
						// Now set content
						main.element.html(main.insert_content);
					}
				}
				else if (main.params.insert_fn == 'before')
				{
					// Now set content
					main.element.prepend(main.insert_content);
				}
				else if (main.params.insert_fn == 'after')
				{
					// Now set content
					main.element.append(main.insert_content);
				}
				
				// Where animation emds
				if (main.params.animate_insert)
				{
					main.animateInsert(main.element, element_initial_height);
				}
			}
			
			if (callback)
			{
				if (main.params.animate_insert && (main.insert_content || main.update_element))
				{
					// Don;t call callback until main.insert_content and main.update_element have set content over a 400ms period
					// That way, by the time callback is called, all animations are completed
					setTimeout(function()
					{
						callback();
					}, 400);
				}
				else
				{
					callback();
				}
			}
		}
		
		// Analyze parts of a dom string
		// Extract the requested fragment and run response scripts
		main.parseDom = function(response)
		{
			var DOM = $.parseHTML(response);
			var DOM = $(DOM);
			if (DOM)
			{
				var feedback = {};
				
				var result_extract = main.request_url__hash || main.params.result_extract;
				if (result_extract == '#')
				{
					main.insert_content = DOM;
				}
				else if (result_extract && DOM.find(result_extract).length)
				{
					main.insert_content = $(DOM.find(result_extract));
				}
				else if (main.params.result_extract2 && DOM.find(main.params.result_extract2).length)
				{
					main.insert_content = $(DOM.find(main.params.result_extract2));
				}
				
				if (main.update_element && DOM.find(main.params.result_update).length/*in result document*/)
				{
					main.update_content = $(DOM.find(main.params.result_update));
				}
				
				// ------------------------------------
				
				if (main.params.parse_response_element && $(DOM.find(main.params.parse_response_element)).length)
				{
					// Get the first non-empty element.
					var response_element = $(DOM.find(main.params.parse_response_element).filter(function()
					{
						// Empty elements shouldn't be part of the list.
						return $(this).text() != '';
					})[0]);
					
					feedback.msg = response_element.text();
				}
				
				// ------------------------------------
				
				// Parse response scripts?
				if (main.params.parse_response_scripts)
				{
					// Lets find all scripts returned
					// Note: this wont see the scripts in the head section
					scripts = $(DOM.find('script'));
					if (scripts.length)
					{
						//eval(scripts.html());
						scripts.remove();
					}
				}
				
				// ------------------------------------

				// Popstate
				if (main.params.browser_pushstate)
				{
					// Compare location.path of main.url with current window's location.path... and decide what to do
					var current_window_location_path_no_hash = window.location.pathname.replace(window.location.hash, "");
					var request_url_path__no_hash = ~main.request_url__no_hash.indexOf('?') ? main.request_url__no_hash.substr(0, main.request_url__no_hash.indexOf('?')) : main.request_url__no_hash;
					if ((main.params.browser_pushstate !== 'auto' && (request_url_path__no_hash !== current_window_location_path_no_hash)) || (main.params.browser_pushstate === 'auto' && request_url_path__no_hash === current_window_location_path_no_hash))
					{
						var new_location_url = main.url;
						if (main.params.type.toLowerCase() == 'get')
						{
							// Rebuild url with main.data added
							new_location_url = main.request_url__no_hash + (main.data ? '?' + main.data : '') + (main.request_url__hash ? '#' + main.request_url__hash.replace('#', '') : '');
						}
						
						if (typeof window.history.pushState !== 'undefined')
						{
							history.pushState({name: 'bravecode'}/*state object*/, '',/*title*/ new_location_url/*url*/);
						}
						else
						{
							window.location.assign(new_location_url/*url*/);
						}
					}
				}
				
				return feedback;
			}
			
			return false;
		}
		
		
		// Understand and import string
		// and get import content from current document or via ajax
		main.ajaxRequest = function(success_callback, error_callback)
		{
			main.request_url__hash = main.params.result_extract;
			main.request_url__no_hash = main.url;
			 
			if (~main.url.indexOf("#"))
			{
				var hash = main.url.indexOf("#");
				// Fragment to extract
				main.request_url__hash = (main.url.substr(hash));
				// Actual url
				main.request_url__no_hash = main.url.substr(0, hash);
			}
			
			// Begin this right away
			main.showProgressExternal();  
			
			if (main.isRequesting())
			{
				return;
			}
		
			// Create fresh request
			main.ongoing_request = $.ajax(
			{
				url: main.request_url__no_hash,
				data: main.data,
				type: main.params.type,
				processData: false,
				contentType: false,
				cache: main.params.cacheable,
				async: main.params.async,
				success: success_callback,
				error: error_callback,
				xhr: function()
				{
					 var xhr = new window.XMLHttpRequest();
					 
					 //Upload progress
					 xhr.upload.addEventListener("progress", function(evt)
					 {
						 if (evt.lengthComputable)
						 {
							 main.showProgress(evt.loaded, evt.total);
						 }
					 }, false);
					 
					 //Download progress
					 xhr.addEventListener("progress", function(evt)
					 {
						 if (evt.lengthComputable)
						 {
							 main.showProgress(evt.loaded, evt.total, true/*is_downloading*/);
						 }
					 }, false);
					 
					 return xhr;
				}
			});
		}
		
		
		main.abortRequest = function(request_handle)
		{
			// Cancel any ongoing requests of this call
			var request_handle =  request_handle ? request_handle : main.ongoing_request;
			if (main.isRequesting())
			{
				request_handle.abort();
				return true;
			}
			
			return false;
		}
		
		
		main.isRequesting = function(request_handle)
		{
			var request_handle =  request_handle ? request_handle : main.ongoing_request;
			// Any ongoing requests of this call?
			if (request_handle && request_handle.state() === 'pending')
			{
				return true;
			}
			
			return false;
		}
		
		
		
		
		
		
		main.makeRequest = function(is_retrying)
		{
			// Call before-functions
			main.events.statusChange('started', null);
			
			// Waiting/Retrying display, progressbar etc
			if (typeof is_retrying && is_retrying)
			{
				main.showRetry(main.params.retrying_msg);
			}
			else
			{
				main.showWaiting(main.params.waiting_msg);
			}
			
			// Process request
			main.ajaxRequest(function(response, textStatus, request)
			{
				// WE ARE EXPECTING ONLY TWO TYPES OF RESPONSES: JSON, HTML
				if (response.substr(0, 1) == '{')
				{
					var json_response = JSON.parse(response);
					if (json_response.status)
					{
						// Status is usually set by bravecode installer
						main.throwSuccess(json_response.status);
					}
					
					if (json_response.location)
					{
						if (json_response.rdr_e_msg)
						{
							main.throwError(json_response.rdr_e_msg);
						}
						else if (json_response.rdr_s_msg)
						{
							main.throwSuccess(json_response.rdr_s_msg);
						}
						
						if (main.ajax_process_element_status.length && !json_response.force_rdr)
						{
							var overview_params = {
								trigger: 1,
								type: 'modalview',
								axis:'Z',
								placement:'C',
								alignment:'C',
								auto_focus:true,
							};
							
							var req_params = {
								url: json_response.location,
								OnContentLoaded: window.uiInit
							}
							
							main.ajax_process_element_status.OverviewReq(overview_params, req_params);
						}
						else
						{
							window.location.assign(json_response.location/*url*/);
						}
					}
				}
				else
				{
					// Call after-functions
					var parsed = main.parseDom(response);
					// Content
					if (parsed)
					{
						if (main.insert_content || main.update_content)
						{
							main.setContent(function()
							{
								// Fire event
								main.events.contentLoaded();
								main.throwSuccess(parsed.msg ? parsed.msg : 'Done!');
							});
						}
						else
						{
							console.log(response);
							main.throwError('Error extracting parsed content!');
						}
					}
					else
					{
						console.log(response);
						// Tell control about error
						main.throwError('Error parsing response!');
					}
				}
				
				// ------------------------------------
				
				main.events.statusChange('completed', null);
			},
			function()
			{
				main.throwError('Error making request!');
			});
		}
		
		
		main.execRequest = function()
		{
			main.bindControls();
			
			// Fire event for all those listening
			// This event may also cancel any ongoing requests on this element
			//main.events.statusChange('started', null); // Oh this has already fired on main.makeRequest().
			
			// Listen to a similar event fired somewhere after our own on this same element
			// Then cancel our own... no multiple requests on one element
			if (main.params.show_status && main.ajax_process_element)
			{
				main.ajax_process_element.on(main.params.event_namespace + 'statuschange', function(e, d)
				{
					if (e.currentTarget === e.target/*Only if this event happend directly on element.*/ && d.status === 'started')
					{
						main.abortRequest();
					}
				})
			}
			
			
			// ---------------------------------------------------------
			var trigger = function(e, true_state)
			{
				if (e && e.type)
				{
					main.user_initiated = true;
				}
				
				if (true_state !== false)
				{
					if (!main.isRequesting())
					{
						main.makeRequest()
					}
					else if (main.params.control_toggle)
					{
						main.abortRequest();
					}
				}
				else
				{
					main.abortRequest();
				}
			}
			
			main.element.attachTrigger(main.params.trigger, trigger);
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
		
		main.execRequest();
	}
})(jQuery);
