// JavaScript Document
(function($)
{
	$.fn.CollapsibleHeirachy = function()
	{
		return this.each(function(i, el)
		{
			new collapsibleHeirachyObject(el);
		})
	}

	var collapsibleHeirachyObject = function(el)
	{
		var el = $(el);
		var main = this;
		
		main.switchIcons = function()
		{
			var icon_expanded = el.attr('data-icon-expanded') ? el.attr('data-icon-expanded') : 'fa-angle-up';
			var icon_collapsed = el.attr('data-icon-collapsed') ? el.attr('data-icon-collapsed') : 'fa-angle-down';
			el.find('[data-collapsible] ._control').each(function(i, element)
			{
				var element = $(element);
                if ($(element.parents('[data-collapsible]')[0]).find('[data-collapsible][data-state="expanded"], [data-collapsible][data-state="expanding"]').length)
				{
					element.children('.fa').removeClass(icon_collapsed).addClass(icon_expanded);
				}
				else
				{
					element.children('.fa').removeClass(icon_expanded).addClass(icon_collapsed);
				}
            });
		}
		// Do this at startup
		main.switchIcons();
		
		el.on('click', '[data-collapsible] ._control, [data-collapsible] > ._label', function(e)
		{
			var element = $(this);
			var li_parent = $(element.parents('[data-collapsible]')[0]);
			var outer_collapsibles = li_parent.siblings('[data-collapsible]');
			var inner_collapsibles = li_parent.children('*').children('[data-collapsible]');
			var inner_collapsibles_active = li_parent.children('*').children('[data-collapsible].active');
			
			if (!li_parent.hasClass('active'))
			{
				outer_collapsibles.css({opacity: 0.1}).trigger('collapsible.collapse');
				li_parent.addClass('active')//.children('a').addClass('b');
				
				setTimeout(function()
				{
					// Only show the currently active one
					if (inner_collapsibles_active.length)
					{
						inner_collapsibles_active.css({opacity: 0.35}).trigger('collapsible.expand');
					}
					else
					{
						inner_collapsibles.css({opacity: 0.35}).trigger('collapsible.expand');
					}
					
					main.switchIcons();
					setTimeout(function()
					{
						if (inner_collapsibles_active.length)
						{
							inner_collapsibles_active.animate({opacity: 1}, 150);
						}
						else
						{
							inner_collapsibles.animate({opacity: 1}, 150);
						}
					}, 150);
				}, 150);
			}
			else
			{
				// Only show the currently active one
				if (inner_collapsibles_active.length)
				{
					inner_collapsibles_active.css({opacity: 0.35}).trigger('collapsible.collapse');
				}
				else
				{
					inner_collapsibles.css({opacity: 0.35}).trigger('collapsible.collapse');
				}
				
				setTimeout(function()
				{
					outer_collapsibles.css({opacity: 0.1}).trigger('collapsible.expand');
					li_parent.removeClass('active')//.children('a').removeClass('b');
					
					main.switchIcons();
					setTimeout(function()
					{
						outer_collapsibles.animate({opacity: 1}, 150);
					}, 150);
				}, 150);
					
			}
			
			e.preventDefault();
		});
	}
	

})(jQuery);
