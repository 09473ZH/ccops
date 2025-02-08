function batch(process: (taskId: number) => Promise<void>, limit = -1) {
  return function batchProcess(tasks: number[]) {
    const results: any[] = [];
    let finished = 0;
    let current = 0;
    let rejected = false;

    function tryProcess(resolve: (value: any) => void, reject: (reason?: any) => void) {
      if (rejected) return;
      if (finished >= tasks.length) {
        resolve(results);
        return;
      }
      if (current >= tasks.length) return;

      const index = current;
      current += 1;
      process(tasks[index]).then(
        (result) => {
          results[index] = result;
          finished += 1;
          tryProcess(resolve, reject);
        },
        (err) => {
          reject(err);
          rejected = true;
        },
      );
    }

    return new Promise((resolve, reject) => {
      const realLimit = limit > 0 ? limit : tasks.length;
      for (let i = 0; i < realLimit; i += 1) {
        tryProcess(resolve, reject);
      }
    });
  };
}

const batchProcessTasks = async (
  taskIds: number[],
  processFn: (taskId: number) => Promise<void>,
) => {
  const success: number[] = [];
  const failed: number[] = [];

  const process = async (taskId: number) => {
    try {
      await processFn(taskId);
      success.push(taskId);
    } catch {
      failed.push(taskId);
    }
  };

  await batch(process, 10)(taskIds);
  return { success, failed };
};

export default batchProcessTasks;
