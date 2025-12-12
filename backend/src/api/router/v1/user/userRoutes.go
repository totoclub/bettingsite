package router

import (
	"github.com/gin-gonic/gin"
	"github.com/hotbrainy/go-betting/backend/api/controllers"
	"github.com/hotbrainy/go-betting/backend/api/middleware"
)

func GetUserRoute(r *gin.RouterGroup) {

	r.Use(middleware.RequireAuth)
	r.GET("/me", controllers.Me)
	r.POST("/checkPassword", controllers.CheckPassword)
	r.GET("/myprofile", controllers.GetMyProfile)
	r.POST("/me", controllers.UpdateMe)
	r.GET("/getInfo", controllers.GetInfo)
	r.GET("/wager-and-level-targets", controllers.GetWagerAndLevelTargets)
	// Category routes
	catRouter := r.Group("/categories")
	{
		catRouter.GET("/", controllers.GetCategories)
		catRouter.POST("/create", controllers.CreateCategory)
	}

	// Post routes
	postRouter := r.Group("/posts")
	{
		postRouter.GET("/", controllers.GetPosts)
		postRouter.POST("/create", controllers.CreatePost)
		postRouter.GET("/:id/show", controllers.ShowPost)
		postRouter.GET(":id/edit", controllers.EditPost)
		postRouter.PUT("/:id/update", controllers.UpdatePost)
		postRouter.DELETE("/:id/delete", controllers.DeletePost)
		postRouter.GET("/all-trash", controllers.GetTrashedPosts)
		postRouter.DELETE("/delete-permanent/:id", controllers.PermanentlyDeletePost)
	}

	// Comment routes
	commentRouter := r.Group("/posts/:id/comment")
	{
		commentRouter.POST("/store", controllers.CommentOnPost)
		commentRouter.GET("/:comment_id/edit", controllers.EditComment)
		commentRouter.PUT("/:comment_id/update", controllers.UpdateComment)
		commentRouter.DELETE("/:comment_id/delete", controllers.DeleteComment)
	}

}
