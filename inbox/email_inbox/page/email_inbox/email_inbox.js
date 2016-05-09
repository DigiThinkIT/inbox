//frappe.require('assets/inbox/js/lib/jquery.bootpag.min.js')
frappe.require('assets/inbox/js/lib/bootstrap-paginator.min.js')

frappe.pages['Email Inbox'].on_page_load = function(wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Email Inbox',
		icon: 'icon-inbox',
		single_column: false
	});

	//frappe.Inbox2.render_headers(page)
	wrapper.Inbox = new frappe.Inbox(wrapper);

	//frappe.Inbox2.make_menu(page)
	//frappe.Inbox2.render_headers(page)
    //frappe.Inbox2.render_sidemenu(page)

	//frappe.Inbox2.render_list(page,frappe.Inbox.account)

}

frappe.breadcrumbs.add("Setup");


frappe.Inbox= Class.extend({
    init: function (wrapper) {
		wrap = this;
        this.wrapper = wrapper;
		this.filters = {};
		this.page_length  = 20;
		this.start = 0;
		this.cur_page = 1;

		//remove use pages/////////////////////////
		this.end = this.start + this.page_length;


		this.render_headers();
		//this.result_list = $(this.wrapper).find(".result-list")


		this.render_sidemenu();
		if (this.account) {
			this.render_list();
			this.render_footer();
			this.render_buttons();
			this.init_select_all();
			this.make_filters();
		}else{
			alert("no email account assigned to you")
		}


		//this.get_paging()
		//this.body.add_custom_button("",function(val){console.log(val)},'icon-angle-double-left','class')
    },
	render_headers: function(){
        //$(cur_frm.fields_dict['inbox_list'].wrapper)
		$(".layout-main-section-wrapper").css("padding-left","0px").css("padding-right","0px")
		var data = {"start":this.start,"page_length":this.page_length.toString()}
		this.headers = $(this.wrapper.page.main).append(frappe.render_template("inbox_headers", data))

    },
	render_sidemenu: function () {
		var me = this
        frappe.call({
			method: 'inbox.email_inbox.page.email_inbox.get_accounts',
			args:{user:frappe.user["name"]},
			async:false,
			callback:function(list){
				var buttons = '<div class="layout-main-section">';
				if (list["message"]){
				me.account = list["message"][0]["email_account"];
				buttons += '<div class="list-row inbox-select list-row-head" style="font-weight:bold"> <div class="row"><span class="inbox-item col-md-12 " style="margin-left: 10px;">'+list["message"][0]["email_account"]+'</span> </div></div>';
				for (var i = 1;i<list["message"].length;i++)
				{
					buttons += '<div class="list-row inbox-select"> <div class="row"><span class="inbox-item col-md-12" style="margin-left: 10px;">'+list["message"][i]["email_account"]+'</span> </div></div>';
				}
				me.wrapper.page.sidebar.append(buttons).addClass('hidden-sm hidden-xs');
				$(".inbox-select").click(function(btn){
					me.account = $(btn.currentTarget).find(".inbox-item").html();
					$(me.wrapper.page.sidebar).find(".list-row").removeClass("list-row-head").css("font-weight","normal");
					$(btn.currentTarget).closest(".list-row").addClass("list-row-head").css("font-weight","bold");
					me.cur_page = 1;
					$(".list-select-all").prop("checked",false);
					me.render_list();
					$(me.footer).bootstrapPaginator();
				});

					//for mobile sidemenu
					$(".form-sidebar").show();
					$(".sidebar-left").find(".form-sidebar").append(buttons);
				$(".inbox-select").click(function(btn){
					console.log(btn)
					me.account = $(btn.currentTarget).find(".inbox-item").html();
					$(".form-sidebar").find(".list-row").removeClass("list-row-head").css("font-weight","normal");
					$(btn.currentTarget).closest(".list-row").addClass("list-row-head").css("font-weight","bold");
					me.cur_page = 1;
					$(".list-select-all").prop("checked",false);
					me.render_list();
					me.render_footer()
				});
						//'<ul class="list-unstyled sidebar-menu standard-actions"><li><a>No rest</a></li></ul>'
				me.wrapper.page.sidebar.removeClass("col-md-2").addClass("col-md-1").width('0%');
				}
			}
        })
    },
	render_list: function(){
		var me = this;
        frappe.call({
                method: 'inbox.email_inbox.page.email_inbox.get_list',
                args:{
                    email_account:me.account,
					start:(me.cur_page-1)*me.page_length,
					page_length:me.page_length
                },
				aync: true,
                callback: function (list) {
					me.data = {};
					var data = list["message"];
					for (var i =0;i<data.length;i++){
						me.data[data[i].name]= data[i]
					}
					$(me.wrapper).find(".result-list").html("");
					for (var i =0;i<data.length;i++)
					//for (var item in me.data)
					{
						$(me.wrapper).find(".result-list").append(frappe.render_template("inbox_list", {data:data[i]}));//me.data[i]}));
					}
					$(me.wrapper).find(".doclist-row").click(function(btn){
						if ($(btn.target).hasClass("noclick")){
						return
						}
						var name = $(btn.target).closest(".doclist-row").data("name");
						if (me.data[name]["nomatch"]||me.data[name]["supplier"]||me.data[name]["customer"]) {
							me.email_open(btn);
						}else{
							me.company_select(btn);
						}
					});
					$(me.wrapper).find(".relink-link").click(function(btn){
						var name = $(btn.target).closest(".doclist-row").data("name");
						me.relink(name);
					})

                }
            })
    },
	render_footer:function(){
		var me = this;
		frappe.call({
                method: 'inbox.email_inbox.page.email_inbox.get_length',
                args:{
                    email_account:me.account
                },
                callback: function (r) {
					me.data_length = r.message[0][0]
					me.last_page = Math.ceil(r.message[0][0]/me.page_length);
					var data = {"cur_page":me.cur_page,"last_page":me.last_page,"data_length":me.data_length};
					//me.footer = $(me.wrapper).find(".footer");
					me.footer = $(me.wrapper).append(' <footer class="footer" style="position: fixed;bottom: 0;width: 100%;height: 60px;background-color: #f5f5f5;"><div class="container" > <div class="col-sm-6 hidden-xs"><ul class="foot-con"></ul><div class="footer-numbers" style="vertical-align: middle;float:right;margin: 20px 0"></div></div> </footer>').find(".foot-con");
					//me.footer.html(frappe.render_template("inbox_footer", data))

					me.footer.bootstrapPaginator({
						currentPage: 1,
                		totalPages: 10,
						bootstrapMajorVersion:3,
						onPageClicked: function(e,originalEvent,type,page){
							me.cur_page = page;
							$('.footer-numbers').html('showing: '+(me.cur_page-1)*me.page_length+' to '+me.cur_page*me.page_length+' of '+me.data_length);
							me.render_list();
            			},

					});

					me.update_footer();


					//$(me.wrapper.page.footer).html(frappe.render_template("inbox_footer", data))
					// $(me.wrapper.page.footer).css("position","fixed")
					//$(me.wrapper.page.footer).removeClass("hide");

					//$(".navigation_group").html(frappe.render_template("inbox_footer", data))
					//$(me.wrapper).find(".result-list").append(frappe.render_template("inbox_footer", data))


					$(me.wrapper).find(".btn-group-paging .btn").click(function() {
						me.cur_page = cint($(this).attr("data-value"));
						me.render_list();
						me.render_footer();
					});
                }
            })
	},
	update_footer:function(){
		var me = this;
		frappe.call({
			method: 'inbox.email_inbox.page.email_inbox.get_length',
			args: {
				email_account: me.account
			},
			callback: function (r) {
				me.data_length = r.message[0][0]
				me.last_page = Math.ceil(r.message[0][0] / me.page_length);
				me.footer.bootstrapPaginator({currentPage: 1, totalPages: me.last_page})
				$('.footer-numbers').html('showing: '+(me.cur_page-1)*me.page_length+' to '+me.cur_page*me.page_length+' of '+me.data_length);
			}
		})
	},
	company_select:function(btn)
	{
		var me = this;
		var name = $(btn.target).closest(".doclist-row").data("name");
		var d = new frappe.ui.Dialog ({
			title: __("Match emails to a Company"),
			fields: [{
				"fieldtype": "Heading",
				"label": __("Create new Contact for a Customer or Supplier to Match"),
				"fieldname": "Option1"

				},
				{
					"fieldtype": "Button",
					"label": __("Create new Contact"),
					"fieldname":"newcontact"
				},
				{
				"fieldtype": "Heading",
				"label": __("Do not Match"),
				"fieldname": "Option2"
				},
				{
					"fieldtype": "Button",
					"label": __("Do not Match"),
					"fieldname":"nomatch"
				}]
		});

		d.get_input("newcontact").on("click", function (frm) {
			d.hide();
			frappe.route_titles["create_contact"] = 1;
			var name_split = me.data[name]["sender_full_name"].split(' ');
			var doc = frappe.model.get_new_doc("Contact");
					frappe.route_options = {
						"email_id": me.data[name]["sender"],
						"first_name": name_split[0],
						"last_name":name_split[name_split.length-1],
						"status": "Passive"
					};
					frappe.route_titles["create user account"]=1
					frappe.set_route("Form", "Contact", doc.name);
		});
		d.get_input("nomatch").on("click", function (frm) {
			d.hide();
			frappe.call({
                method: 'inbox.email_inbox.page.email_inbox.setnomatch',
                args:{
                    name:name
                }
            });
			me.data[name]["nomatch"]=1;
			me.email_open(btn)
		});
		d.show();

	},
	email_open:function(btn)
	{
		if (Object.keys($(btn.target).data()).length != 0){
			var cell = $(btn.target).data()["filter"].split(",")[0];
			if (cell =="reference_doctype"){
				return
			}
			if (cell =="company"){
				return
			}
		} 
		var me = this;
		var row ="";
		var name = $(btn.currentTarget).data("name");
		row = me.data[name];
		//mark email as read
		this.mark_read(this,name);
		//start of open email

		var emailitem = new frappe.ui.Dialog ({
                title: __(row["subject"]),
                fields: [{
                    "fieldtype": "HTML",
                    "fieldname": "email"
                }]
            });

		//d.fields_dict.email.$wrapper.html('Hello World');

		var c = me.prepare_email(row);
		emailitem.fields_dict.email.$wrapper.html( frappe.render_template("inbox_display",  {data:c}));
		//emailitem.fields_dict.email.$wrapper.html( frappe.render_template("inbox_display",  {data:c}))
		//$(".section-body").html(frappe.render_template("inbox_display",  {data:c}));

		me.add_reply_btn_event(emailitem, c);
		$(emailitem.fields_dict.email.$wrapper).find(".relink-link").on("click", function () {
			me.relink(name);
		});


		//disabled only for testing bring it back/////////========================================================================================
		$(".modal-dialog").addClass("modal-lg");
		$(".modal-header").find(".modal-title").parent().removeClass("col-xs-7").addClass("col-xs-10");
		$(".modal-header").find(".text-right").parent().removeClass("col-xs-5").addClass("col-xs-2");
		emailitem.show();
	},
	add_reply_btn_event: function (emailitem, c) {
        var me = this;
        $(emailitem.fields_dict.email.$wrapper).find(".reply-link").on("click", function () {
            var name = $(this).attr("data-name");
            var last_email = c;

            // make the composer
            new frappe.views.CommunicationComposer({
                doc: false,//me.frm.doc,
                txt: "",
                frm: false,//me.frm,
				subject: "Re: "+ c.subject,
				recipients: c.sender,
                last_email: last_email
            });
        });
    },
	relink:function(name){
		var me = this;
		var lib = "frappe.desk.doctype.communication_reconciliation.communication_reconciliation";
		var d = new frappe.ui.Dialog ({
			title: __("Relink Communication"),
			fields: [{
				"fieldtype": "Link",
				"options": "DocType",
				"label": __("Reference Doctype"),
				"fieldname": "reference_doctype",
				"reqd": 1,
				"get_query": function () {
					return
					{
						query: lib + ".get_communication_doctype"
					}
				}
			},
				{
					"fieldtype": "Dynamic Link",
					"options": "reference_doctype",
					"label": __("Reference Name"),
					"reqd": 1,
					"fieldname": "reference_name"
				},
				{
					"fieldtype": "Button",
					"label": __("Relink")
				}]
		});
		d.set_value("reference_doctype", me.data[name].reference_doctype);
		d.set_value("reference_name", me.data[name].reference_name);
		d.get_input("relink").on("click", function (frm) {
			values = d.get_values();
			if (values) {
				frappe.confirm(
					'Are you sure you want to relink this communication to ' + values["reference_name"] + '?',
					function () {
						frappe.call
						({
							method: lib + ".relink",
							args: {
								"name": name,
								"reference_doctype": values["reference_doctype"],
								"reference_name": values["reference_name"]
							},
							callback: function (frm) {
								$(me.wrapper).find(".row-named[data-name="+name+"]").find(".reference-document")
									.html(values["reference_name"])
								.attr("href",'#Form/'+values["reference_doctype"]+ '/'+values["reference_name"])
								.attr("title","Linked Doctype: "+values["reference_doctype"]);
								d.hide();
								return false;
							}
						})
					},
					function () {
						show_alert('Document not Relinked')
					}
				)
			}
		});
		d.show();
	},
	make_filters: function() {
		var me = this
		frappe.model.with_doctype('Communication', function() {
		$(".frappe-list").append(frappe.render_template("inbox_filter"))
		this.filter_fields = ["Customer"]
		//this.filter_fields = []
		this.filter_list = new frappe.ui.FilterList({
			listobj: me,
			$parent: $(".frappe-list").find('.list-filters').toggle(true),//this.$w.find('.list-filters').toggle(true),
			doctype: "Communication",
			filter_fields: this.filter_fields
		});
		//if(frappe.model.is_submittable(this.doctype)) {
		//	this.filter_list.add_filter("Page", "ID", "=", "Email Inbox");
		//};
		})
	},
	run:function(more){
	var me = this;
		if(!more) {
			this.start = 0;
			if(this.onreset) this.onreset();
		}

		//if(!me.opts.no_loading)
		//	me.set_working(true);

		frappe.call({
			method: 'frappe.desk.query_builder.runquery',
			type: "GET",
			//freeze: (this.opts.freeze != undefined ? this.opts.freeze : true),
			args: {
				limit_start: this.start,
				limit_page_length: this.page_length
			},
			callback: function(r) {
				if(!me.opts.no_loading)
					me.set_working(false);
				me.dirty = false;
				me.render_results(r);
			},
			//no_spinner: this.opts.no_loading
		});
	},
	prepare_email:function(c){
		var me = this;
		frappe.call({
			method:'inbox.email_inbox.page.email_inbox.get_email_content',
			args:{
				doctype:"Communication",
				name:c.name
			},
			async:false,
			callback:function(r){
				c.attachments =r["message"][0];
				c.content = r["message"][1];
					}
		});

		//
		c.doctype ="Communication";

		/*
		if ((c.comment_type || "Comment") === "Comment" && frappe.model.can_delete("Comment")) {
            c["delete"] = '<a class="close" href="#"><i class="octicon octicon-trashcan"></i></a>';
        } else {
            c["delete"] = "";
        }
		*/

        c.comment_on = comment_when(c.actualdate);


        if (c.attachments && typeof c.attachments === "string")
            c.attachments = JSON.parse(c.attachments);

        if (!c.comment_type)
            c.comment_type = "Email"

		c.comment = c.content
            if (c.comment_type == "Email") {
                c.comment = c.comment.split("<!-- original-reply -->")[0];
                c.comment = frappe.utils.strip_original_content(c.comment);
                c.comment = frappe.dom.remove_script_and_style(c.comment);

                c.original_comment = c.comment;
                c.comment = frappe.utils.toggle_blockquote(c.comment);
            }


            if (!frappe.utils.is_html(c.comment)) {
                c.comment_html = frappe.markdown(__(c.comment));
            } else {
                c.comment_html = c.comment;
                c.comment_html = frappe.utils.strip_whitespace(c.comment_html);
            }



            // bold @mentions
            if (c.comment_type === "Comment") {
                c.comment_html = c.comment_html.replace(/(^|\W)(@\w+)/g, "$1<b>$2</b>");
            }

			/*
            if (in_list(["Comment", "Email"], c.comment_type)) {
                c.user_content = true;
                if (!$.isArray(c._liked_by)) {
                    c._liked_by = JSON.parse(c._liked_by || "[]");
                }

                c.liked_by_user = c._liked_by.indexOf(user) !== -1;
            }
            */
        //}
		return c

	},
    init_select_all: function () {
        var me = this;

		$(".list-select-all").on("click", function () {
			//$(me.wrapper.page).find('.list-delete').prop("checked", $(this).prop("checked"));
			$(".list-delete").prop("checked", $(".list-select-all").prop("checked"));
			me.toggle_actions();
		});

		$(me.wrapper).on("click", ".list-delete", function (event) {
			me.toggle_actions();

			// multi-select using shift key
			var $this = $(this);
			if (event.shiftKey && $this.prop("checked")) {
				var $end_row = $this.parents(".list-row");
				var $start_row = $end_row.prevAll(".list-row")
					.find(".list-delete:checked").last().parents(".list-row");
				if ($start_row) {
					$start_row.nextUntil($end_row).find(".list-delete").prop("checked", true);
				}
			}
		});

		// after delete, hide delete button

		$(me.wrapper).on("render-complete", function () {
			console.log("rendered")
			me.toggle_actions();
		});

    },
	render_buttons: function(){
		var me = this;

		me.wrapper.page.add_action_item("Delete",function(){me.delete_email(me)});
		me.wrapper.page.add_action_item("Mark as UnRead",function(){me.mark_unread(me)});
		me.wrapper.page.add_action_item("Mark as Read",function(){me.mark_read(me)});

		/*
		me.wrapper.page.add_menu_item("menu item1",function(){console.log("hi")},true)



		me.wrapper.page.add_action_icon("icon-download",function(){console.log("hi")})

		me.wrapper.page.set_primary_action("primary action",function(){console.log("primary action")},"icon-inbox","working label")
		me.wrapper.page.set_secondary_action("secondary action",function(){console.log("secondary action")},"icon-inbox","working label")


		me.download = me.wrapper.page.add_field({
		//me.download = me.add_field({
						parent:$(".page-actions"),
						fieldname: "download",
						label: __("Download"),
						fieldtype: "Button",
						icon: "icon-angle-double-left"
					});
		me.download.$input.on("click", function() {

		});
*/
/*
		 var d = me.wrapper.page.add_field({
						fieldname: "download",
						label: __("Download"),
						fieldtype: "Select",
			 			options: ["Customer","Supplier"]
		})

var link = me.wrapper.page.add_field({
				fieldtype: "Link",
				options: "DocType",
				label: __("Reference Doctype"),
				fieldname: "reference_doctype",
				get_query: function () {
					return
					{
						query: ["Customer","Supplier"]//lib + ".get_communication_doctype"
					}
				}
})
var link = me.wrapper.page.add_field({
					fieldtype: "Dynamic Link",
					options: "reference_doctype",
					label: __("Reference Name"),
					fieldname: "reference_name"
				})

*/
		
	},

    toggle_actions: function () {
        var me = this;
        if (me.wrapper.page.main.find(".list-delete:checked").length) {
            //show buttons
			$(me.wrapper.page.actions_btn_group).show()
        } else {
            //hide button
			$(me.wrapper.page.actions_btn_group).hide()
        }
    },
	delete_email:function(me){
		//could add flag to sync deletes but not going to
		me.action_checked_items('.parent().hide()')
		me.update_local_flags(names,"deleted","1")
	},
	mark_unread:function(me){
		var names = me.action_checked_items('.data("name")')
		me.create_flag_queue(names,"-FLAGS","(\\SEEN)","seen")
		me.action_checked_items('.css("font-weight", "BOLD")')
		me.update_local_flags(names,"seen","0")
	},
	mark_read:function(me,name){
		if (!name) {
			var names = me.action_checked_items('.data("name")')
			me.action_checked_items('.css("font-weight", "normal")')
		} else{
			var names = [name]
			$(".row-named").filter("[data-name="+name+"]").css("font-weight", "normal")
		}
		me.create_flag_queue(names,"+FLAGS","(\\SEEN)","seen")
		me.update_local_flags(names,"seen","1")

	},
	create_flag_queue:function(names,action,flag,field){
		frappe.call({
                method: 'inbox.email_inbox.page.email_inbox.create_flag_queue',
                args:{
                    names:names,
					action:action,
					flag:flag,
					field:field
                }
            })
	},
	update_local_flags:function(names,field,val){
			frappe.call({
                method: 'inbox.email_inbox.page.email_inbox.update_local_flags',
                args:{
                    names:names,
					field:field,
					val:val
                }
            })
	},
	get_checked_items: function() {
		return $.map(this.wrapper.page.main.find('.list-delete:checked'), function(e) {
			return $(e).parents(".doclist-row").data('name');
		});
	},
	action_checked_items: function(action) {
		return $.map(this.wrapper.page.main.find('.list-delete:checked'), function(e) {
			return eval('$(e).parents(".doclist-row")'+action);
		});
	},
	///unused////////////////////////////
	add_field: function(df) {
		var f = frappe.ui.form.make_control({
			df: df,
			only_input: df.fieldtype!="Check",
		})
		f.refresh();
		$(f.wrapper)
			.addClass('col-md-2')
			.attr("title", __(df.label)).tooltip();
		f.$input.addClass("input-sm").attr("placeholder", __(df.label));

		if(df.fieldtype==="Check") {
			$(f.wrapper).find(":first-child")
				.removeClass("col-md-offset-4 col-md-8");
		}

		if(df.fieldtype=="Button") {
			$(f.wrapper).find(".page-control-label").html("&nbsp;")
			f.$input.addClass("btn-sm").css({"width": "100%", "margin-top": "-1px"});
		}

		if(df["default"])
			f.set_input(df["default"])
		this.fields_dict[df.fieldname || df.label] = f;
		return f;
	},
	///unused////////////////////////////
	notifyUser:function (event) {
		var title;
		var options;

		event.preventDefault();

		if (event.target.id === 'button-wn-show-preset') {
			title = 'Email received';
			options = {
				body: 'You have a total of 3 unread emails',
				tag: 'preset',
				icon: 'http://www.audero.it/favicon.ico'
			};
		} else {
			title = document.getElementById('title').value;
			options = {
				body: document.getElementById('body').value,
				tag: 'custom'
			};
		}
	}
});