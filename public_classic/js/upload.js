
var swfu;

function initSWFUpload (form) {
    function on_file_queued(file) {
	console.info('file queued', file);    
	$('#fileinfo', form).html(file.name);
	this.startUpload(file.id);
    }
    
    function on_upload_progress(file, loaded, total) {
	var prog = loaded * 100/total;
	$('#upload-progress', form).css('width', '' + prog + 'px');
	console.info('upload progress', loaded/total);
    }
    
    function on_upload_success(file, data, resp) {
	console.info('upload success', file, data);
	$('#id_uploaded_file', form).val(data);
    }

    var swfoptions = {
	'upload_url': '/upload',
	'flash_url': '/swfupload/swfupload.swf',
	'file_size_limit': '20 MB',
	'button_placeholder_id': 'photo-upload',
	//'button_image_url': '/public/img/upload.png',
	'button_width': 36,
	'button_height': 30,
	'button_text': '图片',
	//'button_text_style': 'font-size: 20px;,
	'button_text_left_padding': 2,
	'button_text_top_padding': 2,
	'file_types': '*.jpg;*.gif;*.png',
	'file_queue_limit': 1,
	'file_queued_handler': on_file_queued,
	'upload_progress_handler': on_upload_progress,
	'upload_success_handler': on_upload_success
    };
    swfu = new SWFUpload(swfoptions);
}