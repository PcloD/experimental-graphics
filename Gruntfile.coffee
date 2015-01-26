con = console

grunt = require('grunt')
# stylus = require('stylus')

grunt.loadNpmTasks('grunt-contrib-coffee')
grunt.loadNpmTasks('grunt-contrib-watch')
grunt.loadNpmTasks('grunt-contrib-stylus')
grunt.loadNpmTasks('grunt-contrib-jade')
grunt.initConfig(
  watch:
    coffee:
      files: ["#{__dirname}/src/*.coffee"]
      tasks: ['coffee:compile']
    stylus:
      files: ["#{__dirname}/stylus/*.styl"]
      tasks: ['stylus:compile']
    jade:
      files: ["#{__dirname}/jade/*.jade"]
      tasks: ['jade:compile']

  coffee:
    compile:
      expand: true
      flatten: true
      cwd: "#{__dirname}/src/"
      src: ['*.coffee']
      dest: 'js/'
      ext: '.js'

  jade:
    compile:
      options: {
        client: false,
        pretty: true
        # data: (dest, src) ->
        #   console.log("log", dest,src)
        #   return {data:"hello", path:dest}
      }
      files: [
        {
          expand: true
          cwd: 'jade/'
          src: ["**/*.jade"] # , "!**/_**" 
          dest: 'html/'
          ext: '.html'
        }
      ]

  stylus:
    compile:
      files: [
        {
          expand: true
          cwd: "#{__dirname}/stylus/"
          src: ["*.styl"]
          dest: "css"
          ext: ".css"
        }
      ]
      options:
        compress: false
        expand: true
)



# grunt.registerTask("compile", "", () ->
#   # (true)
#   con.log('compile ok')
# )

# grunt.registerTask("default", "", () ->
#   # (true)
#   con.log('ok')
# )
