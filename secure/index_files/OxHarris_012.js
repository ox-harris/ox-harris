// JavaScript Document
(function($)
{
	$.fn.OverviewReq = function(overview_params, req_params, use_attr_opts)
	{
		return this.each(function(i, el)
		{
			new OverviewReqObject(el, overview_params, req_params, use_attr_opts);
		})
	}
	
	var OverviewReqObject = function(element, overview_params, req_params, use_attr_opts)
	{
		// Lets save the this globally as main
		var main = this;
		// Element
		main.element = $(element);
		main.overview_obj = null;
		
		main.params1 = {
			type: 'overviewreq',
			header_content: null,
			main_content: null,
			footer_content: null,
			alignment: 'A,B,C',
			placement: 'A,B,C',
			axis: 'X,Y,Z',
			footer_controls: true,
			OnInitialize: function()
			{
				main.overview_obj = this;
			},
			OnContentSet: function(overview_element)
			{
				var subject_element = this;
				var main_content_element = overview_element.find('.overview-main > ._content');
				
				if (subject_element.attr('data-overviewreq-params'))
				{
					main_content_element.attr('data-interactivereq-params', subject_element.attr('data-overviewreq-params'));
				}
				
				// Anticipated events from interactive request
				overview_element.on('interactivereq.contentloaded', function(e)
				{
					// No need to ecalculate subject element
					// Just reposition
					main.overview_obj.positionOverview();
				})
				
				// Ofcourse no multiple req on the same element... InteractiveReq() automatically handles that
				main_content_element.InteractiveReq(main.params2, main.use_attr_opts);
				// Let the exit button both exit the request and close overview
				var exit_button = main_content_element.find('[data-action=exit]');
				exit_button.wrap('<span data-action="close" class="display-in-block"></span>');
			}
		};
		
		main.params2 = {
			show_status: true,
			parse_response_scripts: true,
			browser_pushstate: false,
			cacheable: true,
		};
		
		// Combine params
		$.extend(main.params1, overview_params);	
		$.extend(main.params2, req_params);	
		
		main.use_attr_opts = use_attr_opts;
		
		// Begin
		main.element.Overview(main.params1, main.use_attr_opts);
	}
})(jQuery)
