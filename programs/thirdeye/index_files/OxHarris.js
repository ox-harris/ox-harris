// JavaScript Document
(function($)
{
	$.fn.InfiniteFeeds = function(opts, req_params, use_attr_opts)
	{
		/** 
		  * Loop thru each matched and call repective functions 
		  */
		return this.each(function(i, el)
		{
			new InfiniteFeedsObject(el, opts, req_params, use_attr_opts);
		})
		
		//----------------------
	}
	
	var InfiniteFeedsObject = function(el, opts, req_params, use_attr_opts)
	{

		var main = this;
		
		main.container_element = $(el);
		
		main.params = {
			seek_element_selector: null,
			max_round_trips: null,
		}
		
		$.extend(main.params, opts);
		main.initParams = function()
		{
			// Get params from element's attribute
			if (main.params.use_attr_opts !== false)
			{
				if (main.container_element.attr('data-infinitefeeds-params') && typeof Ox.parseProps !== 'undefined')
				{
					var el_params = Ox.parseProps(main.container_element.attr('data-infinitefeeds-params'));
					$.extend(main.params, el_params);
				}
			}
		};
		main.initParams();
		
		main.req_params = {
			insert_fn: 'self_replace',
			result_extract: '._section',
			parse_response_scripts: false,
			browser_pushstate: true,
			OnStatusChange: function(d, ajax_process_element)
			{
				var main_element = this;
				if (d.status === 'success')
				{
					if (main.max_round_trips > 0)
					{
						main.max_round_trips --;
					}
					
					if (main.params.max_round_trips === null || (main.params.max_round_trips && main.current_round_trips < main.params.max_round_trips))
					{
						main.roundTrip();
					}
				}
			},
		}
		
		$.extend(main.req_params, req_params);
		
		main.roundTrip = function()
		{
			var seek_element = $(main.container_element.find(main.params.seek_element_selector));
			
			if (seek_element.length)
			{
				var feeds_url = seek_element.attr('data-feeds-url');
				var req_params = main.req_params;
				req_params.url = feeds_url;
				seek_element.scrollIn(function()
				{
					if (!seek_element.requesting)
					{
						seek_element.InteractiveReq(req_params, main.use_attr_opts);
					}
		
				}, {direction: 'up', lead: 300});
			}
		}
		
		main.roundTrip();
	}
})(jQuery);
