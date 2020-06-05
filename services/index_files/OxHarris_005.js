// JavaScript Document
(function($) 
{
	$.fn.TableFuncs = function(opts, use_attr_opts)
	{
		/** 
		  * Loop thru each matched and call repective functions 
		  */
		return this.each(function(i, el)
		{
			new TableFuncsObject(el, opts, use_attr_opts);
			//----------------------
		});
	}
	
	var TableFuncsObject = function(element, opts, use_attr_opts)
	{
		var main = this;
		
		main.params = {
			event_namespace: 'tablefuncs.',
			
			input_selector: 'input[type="checkbox"], input[type="radio"]',
			row_control_input_selector: '._row_control',
			column_control_input_selector: '._column_control',
			all_control_input_selector: '._rows_columns_control',
			
			row_selector: 'tr, .tr, ._tr',
			column_selector: 'td, th, .td, .th, ._td, ._th',
			
			row_active: 'active',
			column_active: 'active',

			control_icon: '.fa',
			control_icon_all: 'fa-check-square',
			control_icon_none: 'fa-square-o',
			control_icon_some: 'fa-square',
			
			row_funcs: true,
			column_funcs: true,
			
			OnInitialize: null,
			OnStateChange: null
		};
		
		main.element = $(element);
		$.extend(main.params, opts);
		
		main.use_attr_opts = use_attr_opts;
		main.initParams = function()
		{
			// Get params from element's attribute
			if (main.use_attr_opts !== false)
			{
				if (main.element.attr('data-tablefuncs-params') && typeof Ox.parseProps !== 'undefined')
				{
					var el_params = Ox.parseProps(main.element.attr('data-tablefuncs-params'));
					$.extend(main.params, el_params);
				}
			}
		};
		
		main.initParams();
		main.row_funcs = main.params.row_funcs;
		main.column_funcs = main.params.column_funcs;
					
		
		/* -----------------------------------
		------------------------------------ */
		
		main.events = {
			stateChange: function(state, index)
			{
				var data = {state: state, index: index};
				
				// Callback
				if (typeof main.params.OnStateChange === 'string')
				{
					window[main.params.OnStateChange].call(main.element, data);
				}
				else if (typeof main.params.OnStateChange === 'function')
				{
					main.params.OnStateChange.call(main.element, data);
				}
				
				// Event
				main.element.trigger(main.params.event_namespace + 'statechange', data);
			}
		};


		main.rowState = function(row_index, toggle)
		{
			var row = main.getRow(row_index);
			var checks = row.find(main.params.input_selector);
			var checks_not_control = checks.not(main.params.row_control_input_selector);
			
			// BEGIN
			// The onchange listeners from within should ignore this event
			main.row_funcs = false;

			if (toggle)
			{
				if (checks_not_control.is(':checked'))
				{
					checks.prop('checked', false).trigger('change');
				}
				else
				{
					checks.prop('checked', true).trigger('change');
				}
			}

			// Whether source was row_control or not, lets find it and reflect the state on it.
			var row_control = checks.filter(main.params.row_control_input_selector);
			var row_control_icon = row_control.closest(main.params.column_selector/*look within your box*/).find(main.params.control_icon);
			if (checks_not_control.filter(':checked').length == checks_not_control.length)
			{
				// All selected
				main.events.stateChange('row.all', row_index);
				row.addClass(main.params.row_active);
				
				// row_control_icon will now be checked naturally
				row_control.prop('checked', true).trigger('change');
				// Undo any previous state due to 'some'
				row_control_icon.removeClass(main.params.control_icon_some);
			}
			else
			{
				// row_control_icon will now be unchecked naturally
				row_control.prop('checked', false).trigger('change');
				// Undo any previous state due to 'some'
				row_control_icon.removeClass(main.params.control_icon_some);
				
				if (checks_not_control.is(':checked'))
				{
					// Some selected, others not
					main.events.stateChange('row.some', row_index);
					
					// row_control_icon would have been unchecked naturally. Let's change it to some.
					row_control_icon.removeClass(main.params.control_icon_none).addClass(main.params.control_icon_some);
				}
				else
				{
					main.events.stateChange('row.none', row_index);
				}
				
				row.removeClass(main.params.row_active);
			}
			
			// END
			// Return setting to default
			main.row_funcs = main.params.row_funcs;
		}


		main.columnState = function(column_index, toggle)
		{
			var column = main.getColumn(column_index);
			var checks = column.find(main.params.input_selector);
			var checks_not_control = checks.not(main.params.column_control_input_selector);
			
			// BEGIN
			// The onchange listeners from within should ignore these events
			main.column_funcs = false;

			if (toggle)
			{
				if (checks_not_control.is(':checked'))
				{
					checks.prop('checked', false).trigger('change');
				}
				else
				{
					checks.prop('checked', true).trigger('change');
				}
			}
			
			// Whether source was column_control or not, lets find it and reflect the state on it.
			var column_control = checks.filter(main.params.column_control_input_selector);
			var column_control_icon = column_control.closest(main.params.column_selector/*look within your box*/).find(main.params.control_icon);
			if (checks_not_control.filter(':checked').length == checks_not_control.length)
			{
				// All selected
				main.events.stateChange('column.all', column_index);
				column.addClass(main.params.column_active);
				
				// column_control_icon will now be checked naturally
				column_control.prop('checked', true).trigger('change');
				// Undo any previous state due to 'some'
				column_control_icon.removeClass(main.params.control_icon_some);
			}
			else
			{
				// column_control_icon will now be unchecked naturally
				column_control.prop('checked', false).trigger('change');
				// Undo any previous state due to 'some'
				column_control_icon.removeClass(main.params.control_icon_some);
				
				if (checks_not_control.is(':checked'))
				{
					// Some selected, others not
					main.events.stateChange('column.some', column_index);
					
					// column_control_icon would have been unchecked naturally. Let's change it to some.
					column_control_icon.removeClass(main.params.control_icon_none).addClass(main.params.control_icon_some);
				}
				else
				{
					main.events.stateChange('column.none', column_index);
				}
				
				column.removeClass(main.params.column_active);
			}
			
			// END
			// Return setting to default
			main.column_funcs = main.params.column_funcs;
		}
		
		
		main.sortTable = function(column_index, order)
		{
			var column = main.getColumn(column_index);
			var rows_switched = false;
			order = order ? order : 'asc';
			var i;
			// Don't include the column at first row that initiated the sorting
			for (i = 1; i < column.length; i ++)
			{
				if (order == 'asc' && $(column[i]).text().toLowerCase() > $(column[i + 1]).text().toLowerCase())
				{
					main.switchRows();
					rows_switched = true;
				}
				else if (order == 'desc' && $(column[i]).text().toLowerCase() < $(column[i + 1]).text().toLowerCase())
				{
					main.switchRows();
					rows_switched = true;
				}
			}
			
			if (rows_switched)
			{
				// Re-run main.sortTable() until the for-loop
				// runs and funds nothing to switch
				main.sortTable(column_index, order);
			}
			else if (i === 0)
			{
				main.sortTable(column_index, order == 'desc' ? 'asc' : (order == 'asc' ? 'desc' : order));
			}
		}
		  
		
		// -----------------------------------
		
		main.getRow = function(row_index)
		{
			var row = main.element.find(main.params.row_selector).filter(':eq(' + row_index + ')');
			return row;
		}


		main.getColumn = function(column_index)
		{
			var column = main.element.find(main.params.row_selector).find(main.params.column_selector.split(',').join(':eq(' + column_index + '),') + ':eq(' + column_index + ')');
			return column;
		}
		
		
		main.execTablefuncs = function()
		{
			main.element.on('change', main.params.input_selector, function(e)
			{
				var input = $(this);
				if (main.row_funcs)
				{
					var row_index = input.closest(main.params.row_selector).index();
					var row_state = main.rowState(row_index, input.is(main.params.row_control_input_selector)/*toggle*/);
				}
				
				if (main.column_funcs)
				{
					var column_index = input.closest(main.params.column_selector).index();
					var column_state = main.columnState(column_index, input.is(main.params.column_control_input_selector)/*toggle*/);
				}
				
				if (main.row_funcs && main.column_funcs)
				{
					/*click all in first column which are row controls themselves*/
					var rows_columns_state = main.columnState(0, input.is(main.params.all_control_input_selector)/*toggle*/);
				}
			});
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
		
		main.execTablefuncs();			
	}
})(jQuery);
