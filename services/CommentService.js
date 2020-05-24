// 评论的数据库操作
var _ = require('lodash');
var path = require("path");
var dao = require(path.join(process.cwd(),"dao/DAO"));
var commentDAO = require(path.join(process.cwd(), "dao/CommentDAO"));
// 获取数据库模型
databaseModule = require(path.join(process.cwd(), "modules/database"))
var Password = require("node-php-password");
var logger = require("../modules/logger").logger();
var orm = require("orm");

/**
 * 创建评论
 *
 * @param  {[type]}   user 用户数据集
 * @param  {Function} cb   回调函数
 */
module.exports.createComment = (params, cb) => {
	commentDAO.create('CommentModel',
      {
				goods_id: params.goodsId,
				goods_name: params.goodsName,
        comment_content: params.commentContent,
        created_at: new Date().toFormat("YYYY-MM-DD HH24:MI:SS"),
				updated_at: null
      },
      (err, content) => {
        if (err) return cb("创建评论失败");
        result = {
          goodsId: content.goods_id,
        	commentContent: content.comment_content,
					createdAt: content.created_at,
					goodsName: content.goodsName,
        };
        cb(null, result);
      }
    );
};

module.exports.deleteComment = (modelName, params, cb) => {
	var db = databaseModule.getDatabase();
	var Model = db.models[modelName];
	// 不走DAO层， 直接使用表模型 -> 更新数据库
	Model.find({comment_id: params.commentId, is_deleted:0}).each(item => {
		item.is_deleted = 1;
	}).save((err) => {
		if(err) return cb("删除评论失败");
		cb(null, {commentId: params.commentId});
	})
}

module.exports.likeComment = (modelName, params, cb) => {
	var db = databaseModule.getDatabase();
	var Model = db.models[modelName];
	// 不走DAO层， 直接使用表模型 -> 更新数据库
	let likes = -1;
	Model.find({comment_id: params.commentId, is_deleted:0}).each(item => {
		item.comment_likes ++;
		likes = item.comment_likes;
	}).save((err) => {
		if(err) return cb("评论点赞失败");
		cb(null, {commentId: params.commentId, commentLikes: likes});
	})
}

module.exports.dislikeComment = (modelName, params, cb) => {
	var db = databaseModule.getDatabase();
	var Model = db.models[modelName];
	// 不走DAO层， 直接使用表模型 -> 更新数据库
	let likes = -1;
	Model.find({comment_id: params.commentId, is_deleted:0}).each(item => {
		item.comment_dislikes ++;
		dislikes = item.comment_dislikes;
	}).save((err) => {
		if(err) return cb("评论吐槽失败");
		cb(null, {commentId: params.commentId, commentDislikes: dislikes});
	})
}

module.exports.getCommentLst = (params, cb) => {
	var conditions = {};
	if(!params.pagenum || params.pagenum <= 0) return cb("pagenum 参数错误");
	if(!params.pagesize || params.pagesize <= 0) return cb("pagesize 参数错误"); 

	conditions["columns"] = {};
	// format查询条件
	if(params.goodsId) {
		conditions["columns"]["goods_id"] = orm.like("%" + params.goodsId + "%");
	}
	conditions["columns"]["is_deleted"] = 0;

	dao.countByConditions("CommentModel", conditions, (err, count) => {
		if(err) return cb(err);
		pagesize = params.pagesize;
		pagenum = params.pagenum;
		offset = (pagenum - 1) * pagesize;
		if(offset >= count) {
			offset = count;
		}
		limit = pagesize;
		// 构建条件
		conditions["offset"] = offset;
		conditions["limit"] = limit;
		conditions["order"] = "-created_at";

		dao.list("CommentModel", conditions, (err, comments) => {
			if(err) return cb(err);
			var resultDta = {};
			resultDta["total"] = count;
			resultDta["pagenum"] = pagenum;
			resultDta["pagesize"] = pagesize;
			// loadsh处理
			resultDta["comments"] = _.map(comments, comment => {
				return _.omit(comment, ['updated_at']);
			})
			cb(err, resultDta);
		})
	});
}

/**
 * 更新管理员信息
 *
 * @param  {[type]}   params 管理员信息
 * @param  {Function} cb     回调函数
 */
module.exports.updateManager = function (params, cb) {
  managersDAO.update(
    {
      mg_id: params.id,
      mg_mobile: params.mobile,
      mg_email: params.email,
    },
    function (err, manager) {
      if (err) return cb(err);
      cb(null, {
        id: manager.mg_id,
        username: manager.mg_name,
        role_id: manager.role_id,
        mobile: manager.mg_mobile,
        email: manager.mg_email,
      });
    }
  );
};

/**
 * 通过管理员 ID 获取管理员信息
 *
 * @param  {[type]}   id 管理员 ID
 * @param  {Function} cb 回调函数
 */
module.exports.getManager = function (id, cb) {
  managersDAO.show(id, function (err, manager) {
    if (err) return cb(err);
    if (!manager) return cb("该管理员不存在");
    cb(null, {
      id: manager.mg_id,
      rid: manager.role_id,
      username: manager.mg_name,
      mobile: manager.mg_mobile,
      email: manager.mg_email,
    });
  });
};

/**
 * 通过管理员 ID 进行删除操作
 *
 * @param  {[type]}   id 管理员ID
 * @param  {Function} cb 回调函数
 */
module.exports.deleteManager = function (id, cb) {
  managersDAO.destroy(id, function (err) {
    if (err) return cb("删除失败");
    cb(null);
  });
};

/**
 * 为管理员设置角色
 *
 * @param {[type]}   id  管理员ID
 * @param {[type]}   rid 角色ID
 * @param {Function} cb  回调函数
 */
module.exports.setRole = function (id, rid, cb) {
  managersDAO.show(id, function (err, manager) {
    if (err || !manager) cb("管理员ID不存在");

    managersDAO.update({ mg_id: manager.mg_id, role_id: rid }, function (
      err,
      manager
    ) {
      if (err) return cb("设置失败");
      cb(null, {
        id: manager.mg_id,
        rid: manager.role_id,
        username: manager.mg_name,
        mobile: manager.mg_mobile,
        email: manager.mg_email,
      });
    });
  });
};

module.exports.updateMgrState = function (id, state, cb) {
  managersDAO.show(id, function (err, manager) {
    if (err || !manager) cb("管理员ID不存在");

    managersDAO.update({ mg_id: manager.mg_id, mg_state: state }, function (
      err,
      manager
    ) {
      if (err) return cb("设置失败");
      cb(null, {
        id: manager.mg_id,
        rid: manager.role_id,
        username: manager.mg_name,
        mobile: manager.mg_mobile,
        email: manager.mg_email,
        mg_state: manager.mg_state ? 1 : 0,
      });
    });
  });
};

/**
 * 管理员登录
 * @param  {[type]}   username 用户名
 * @param  {[type]}   password 密码
 * @param  {Function} cb       回调
 */
module.exports.login = function (username, password, cb) {
  logger.debug("login => username:%s,password:%s", username, password);
  logger.debug(username);
  managersDAO.findOne({ mg_name: username }, function (err, manager) {
    logger.debug(err);
    if (err || !manager) return cb("用户名不存在");
    if (manager.role_id < 0) {
      return cb("该用户没有权限登录");
    }

    if (manager.role_id != 0 && manager.mg_state != 1) {
      return cb("该用户已经被禁用");
    }

    if (Password.verify(password, manager.mg_pwd)) {
      cb(null, {
        id: manager.mg_id,
        rid: manager.role_id,
        username: manager.mg_name,
        mobile: manager.mg_mobile,
        email: manager.mg_email,
      });
    } else {
      return cb("密码错误");
    }
  });
};
