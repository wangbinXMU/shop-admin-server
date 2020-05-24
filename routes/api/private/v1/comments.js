var express = require("express");
var router = express.Router();
var path = require("path");

// 获取验证模块
var authorization = require(path.join(process.cwd(), "/modules/authorization"));

// 通过验证模块获取用户管理服务
var cmtServ = authorization.getService("CommentService");

// 创建评论
router.post( "/",
  // 验证参数
   (req, res, next) => {
    if (!req.body.commentContent) {
      return res.sendResult(null, 400, "评论内容不能为空");
    }
    if (!req.body.goodsId || !req.body.goodsName) {
      return res.sendResult(null, 400, "商品品id或name不能为空");
    }
    next();
  },
  // 处理业务逻辑
  (req, res, next) => {
    let params = {
     ...req.body
    };
    cmtServ.createComment(params, (err, cmt) => {
      if (err) return res.sendResult(null, 400, err);
      res.sendResult(cmt, 200, "添加评论成功");
    })(req, res, next);
  }
);

router.get("/", 
(req, res, next) => {
  if(!req.query.goodsId) return res.sendResult(null, 400, '商品id不能为空');
  if(!req.query.pagenum || !req.query.pagesize) return res.sendResult(null, 400, '分页参数不能为空');
  next();
 }, 
 (req, res, next) => {
    let params = {...req.query};
    cmtServ.getCommentLst(params, (err, cmt) => {
      if (err) return res.sendResult(null, 400, err);
      res.sendResult(cmt, 200, '获取当前商品评论列表成功')
    })(req, res, next);
  }
 );

 router.delete("/",
  (req, res, next) => {
    if(!req.query.commentId) return res.sendResult(null, 400, 'commentId不能为空');
    next();
  },
  (req, res, next) => {
    let params = { ...req.query };
    cmtServ.deleteComment('CommentModel', params, (err, cmt) => {
      if(err) return res.sendResult(null, 400, err);
      res.sendResult(cmt, 200, '评论删除成功');
    })(req, res, next);
  }
 )

 router.put("/:id/like",
  (req, res, next) => {
    if(!req.params.id) return res.sendResult(null, 400, 'id不能为空');
    next();
  },
  (req, res, next) => {
    let params = { commentId: req.params.id };
    cmtServ.likeComment('CommentModel', params, (err, cmt) => {
      if(err) return res.sendResult(null, 400, err);
      res.sendResult(cmt, 200, '评论点赞成功');
    })(req, res, next);
  }
 )

 router.put("/:id/dislike",
 (req, res, next) => {
   if(!req.params.id) return res.sendResult(null, 400, 'id不能为空');
   next();
 },
 (req, res, next) => {
   let params = { commentId: req.params.id };
   cmtServ.dislikeComment('CommentModel', params, (err, cmt) => {
     if(err) return res.sendResult(null, 400, err);
     res.sendResult(cmt, 200, '评论吐槽成功');
   })(req, res, next);
 }
)

module.exports = router;
