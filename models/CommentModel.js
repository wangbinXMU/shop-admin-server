// 评论模型，关联对应表
module.exports = (db, cb) => {
	// 用户模型
	db.define("CommentModel",{
		comment_id : {type: 'serial', key: true},
    goods_id : Number,
    goods_name: String,
		comment_content : String,
    comment_likes : Number,
    comment_dislikes : Number,
    comment_sub_comments: Number,
    created_at: String,
    updated_at : String,
    is_deleted: String
	},{
		table : "sp_goods_comments"
	});
	return cb();
}