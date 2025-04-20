
          <div className="fixed bottom-16 left-0 right-0 bg-white dark:bg-background pb-2 pt-2 z-10">
            <div className="container max-w-3xl px-4">
              <div className="flex justify-center items-center mb-2">
                <Stopwatch />
              </div>
            
              <Button 
                variant="default" 
                size="lg" 
                onClick={() => saveAllSetsMutation.mutate()} 
                disabled={saveAllSetsMutation.isPending}
                className="w-full text-lg flex items-center"
              >
                {saveAllSetsMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-5 w-5" /> Complete Workout
                  </>
                )}
              </Button>
            </div>
          </div>
