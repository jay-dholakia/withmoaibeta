
import { createMachine, assign } from 'xstate';
import { CoachResource } from '@/services/coach-resource-service';

// Define the context (state) for the resources machine
interface ResourcesContext {
  resources: CoachResource[];
  editingResource: CoachResource | null;
  isAddDialogOpen: boolean;
  isEditDialogOpen: boolean;
  isSubmitting: boolean;
}

// Define events that can be sent to the machine
type ResourcesEvent =
  | { type: 'LOAD_RESOURCES'; resources: CoachResource[] }
  | { type: 'SET_EDITING_RESOURCE'; resource: CoachResource }
  | { type: 'CLEAR_EDITING_RESOURCE' }
  | { type: 'OPEN_ADD_DIALOG' }
  | { type: 'CLOSE_ADD_DIALOG' }
  | { type: 'OPEN_EDIT_DIALOG' }
  | { type: 'CLOSE_EDIT_DIALOG' }
  | { type: 'START_SUBMISSION' }
  | { type: 'COMPLETE_SUBMISSION' }
  | { type: 'SUBMISSION_ERROR' };

export const resourcesMachine = createMachine<ResourcesContext, ResourcesEvent>({
  /** @xstate-layout N4IgpgJg5mDOIC5QAoC2BDAxgCwJYDswBKAOlwgBswBiAZQFUAVAQQCUBRADQHEB1ASQDaABgC6iUAAdGsNHCroAHogCclAGwAOAEz6ArLoDshpYoA0IAJ6IALCVPrDJwzStXFVhfQGYde9QF8vO1QMHHwCYjJeKgYWbi5BCDcJACZKGAJiUhCxBERkNAJ1GxV1TQQARjVw0Oa9fRJDEy09QxMzSwRLG3sENwA2XpKAdn1+ksGHS2s7J0c3Dy8kS2KDCBYQ8IZmPFp6JnHOCYkIpihYvIImksLi0qqS12rw+vqgnvDjAajUaoeYLKYIRAQOBrIhwbYYPYxgduGgsHgCDgSGRCBAcMR6B4vLQfMw-B56ABGeDwNBgWb5Yi0SLRWLxGA7XZAADcR0QJ2q5zgO0IJDIFGoNW4nAgMEOiAIRHwgW4VHW6xc+0ERywtH0J1JZIpdwet3ij1wLw+Xxof3+ADFXoUAYDggRQQQgSrVSB1Rrtdw9QNuCMoTMONN5r7Jh6vT62CiVH4-YR8k7nQA5ACqxDI41JuAUifTM0QzKJxXFXM53MQ-Msg3Fw3FpcOkuO0rATpAYEokzokySNJrNNwISNz5crdYbTYFbdB7Y7Xa7COOTj8Dg9+FYABVXhOqDOwNCEAAjADm+eC6cLQlIUuOsrLFYVdaOfVbqsgdlhLDcdW1CBXR1PV0ENacWhBKVZw4E1FTBJ0XWlXBZWdS93RrOsPQnSNfkjJcYT4YDI1jK8eB4AQ+AgRBkEwFRCl0IpcAQMwvzPdVMJINVxxAyAsJwvD8KIgAFDij1ohiQPPaVr1vONEC0L0GJnViOOKRiuO4pi+JnYSZQ1Hc9QPMUJMlfUxRPOcFKVNT1KInTiS0QNhA0XBw0gT0vQMozZxMmyTLs2zOwcmC4IQpCiG0qC9FswtQFYBBKlzfNRSKYpCz0og+iM-tvLM3yAqI0Kcq-XSQqS8LREnIVpxnOcF0iVc4rXDct13fcD1yg8ErPZLLwS9LMuy3Kr2qm9NzjR89z82N7Qin9OIihVT161NKwAOSI2DmrbIqzO87arzUS8hjvKspWsLrGLjajMxpGrGobmrRrAtayBaZUgKBC56yHRMHwfEicl2RpCsYe+jcifIynqpmdnrpBGd3sJqaJyGQB5G9qTh6l61AcwBhIYUF9wALRAzMciWPJFkgYpQEHSG4VA+HsoM5wsbxoV3CMAh3X6ZRSo4SxMPC9jI3BbcOMjWkoy-MnoaLWXLtulnvtxhnvoCk4Y3MUb5rjJM1qSjbtelucIYq2H84TJGQpLMKHzCrHdcitXcb1oKafhx6BBCF25oxAJWavkdrOv6gSrrKBtKkkaXl3j2aW0ZgwHlZVkVUavOg89ytmp9Dt6ggJpS7L8tq1nGsT1rMvG2cOG3JndQxzGJeibGYu2gr+aLVuNqigtS72-aSuGqr7tD+d2oaiP9sk7tHqx15TzSzn3yrwbvrdq7dZT1Pm9GvOO+KtrVe1tX-YNuFCzSebLNGcuO6HEL968Td-qPm0k-Iq-tAYgWDnzEG5dpZ9xPoBb24CCIQPAtzDCdlHLaUQ45xxXjPAmScYF7zIXXE+CEmECLEQQqRMiFEiJUXAmRbh44OEzUluLYG0txaS1-gglaDs36dUjorFuYg2FPUQTvRWUhb5ixFsHeu-DEoZWYXw9hGtGbw2Rl1USCMtpn1OlXWmAs1BsGLmvEu5cuFVx4UhVel8+GIQfho5+WjsYnSxlQl6cdKoPVniHDeVj643wcXzeWjtBbdQ1rLNeJ8brvwcf-O6A8XFj3CSxNWGsbE8LLjxLs-iBqrTGidPcC1Lwv3RCQnxfI+JPmCd-YJH99aRJiaIqOTisEGxyRmKh+90kfxznLVObc0nnNrvaeuJS66dJAWIyc24gFIRnnJB6iUrZWU6bZYZzyXlrLuqUzpcdul9O1tLLEvC26RPwcMxCJE9klyhSnAel5Fntw7kUw8YLnbwpaTEvGZEylnSfoBV54SbyxLiRrM8GsqKXS1kHE63lIqwpXtXfZjtQVBP2s3eg5KwUVLhVUhFX84XnQRTigs-LRU-jdjC+WcqnpIryjdPFNK1V-lVSql1VtgU6pBT5CZAUp7bmDdJSp1ymkHOxsblpJKuEsJPrEvuLDkFTS1UhKsApJRQJlHKe1CrlWxWVUaqlKbbVR0dgK6t6qj5bMsSCzBprLnJxldfO+D8t4-yfqGsuEao0KujaqtVYbk0au5VGrOBTI0xqzVsrlaqDVFuYmw3p5yBkXKsbDOmVsmXaPbVo85nqjWRvjZ1CNDzjZps5aHSqhjalNrjQm-OxbyGXTncm-mJtekVoLVWgN3aa2Nq6a26CfTtUKNXnbfF9du0qr-qrDZnDu0zP7RwrZIz+0KvLk7E5eNLnXLKZjC2+Nbk7K5t2+onb+5zMHQmntrDUWMuduumRQ7NEW2kSrPtfCNa6OLvo1VpirHLoFvY-WOd0ro0JlO6dyy5ZsKQx44psGDkIYwwuu9czH2DpfU+l977P2fvA5B7RDt4OYMnV7YjPKyO8v-eRp2UK32lqhQ+rmT73mvs-e+79v633AfA44H2ZHkK0aRj7eDI6m7kqg2mi2MKoNodpaJ9xb6KPfqo7RsDP7GM7MVtu3kgA */
  id: 'resources',
  initial: 'idle',
  context: {
    resources: [],
    editingResource: null,
    isAddDialogOpen: false,
    isEditDialogOpen: false,
    isSubmitting: false
  },
  states: {
    idle: {
      on: {
        LOAD_RESOURCES: {
          actions: assign({
            resources: (_, event) => event.resources
          })
        },
        SET_EDITING_RESOURCE: {
          actions: assign({
            editingResource: (_, event) => event.resource
          })
        },
        CLEAR_EDITING_RESOURCE: {
          actions: assign({
            editingResource: null
          })
        },
        OPEN_ADD_DIALOG: {
          target: 'addingResource'
        },
        OPEN_EDIT_DIALOG: {
          target: 'editingResource'
        }
      }
    },
    addingResource: {
      entry: assign({
        isAddDialogOpen: true
      }),
      on: {
        CLOSE_ADD_DIALOG: {
          target: 'idle',
          actions: assign({
            isAddDialogOpen: false
          })
        },
        START_SUBMISSION: {
          target: 'submitting',
          actions: assign({
            isSubmitting: true
          })
        }
      }
    },
    editingResource: {
      entry: assign({
        isEditDialogOpen: true
      }),
      on: {
        CLOSE_EDIT_DIALOG: {
          target: 'idle',
          actions: [
            assign({
              isEditDialogOpen: false,
              editingResource: null
            })
          ]
        },
        START_SUBMISSION: {
          target: 'submitting',
          actions: assign({
            isSubmitting: true
          })
        }
      }
    },
    submitting: {
      on: {
        COMPLETE_SUBMISSION: {
          target: 'idle',
          actions: assign({
            isSubmitting: false,
            isAddDialogOpen: false,
            isEditDialogOpen: false,
            editingResource: null
          })
        },
        SUBMISSION_ERROR: {
          target: 'idle',
          actions: assign({
            isSubmitting: false
          })
        }
      }
    }
  }
});
