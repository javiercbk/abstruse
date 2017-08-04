import { Job } from './model';
import { getBuild } from './build';

export function getJobs(buildId: number): Promise<any> {
  return new Promise((resolve, reject) => {
    new Job().where({ builds_id: buildId }).fetchAll().then(jobs => {
      if (!jobs) {
        reject();
      } else {
        resolve(jobs.toJSON());
      }
    });
  });
}

export function getJob(jobId: number): Promise<any> {
  return new Promise((resolve, reject) => {
    new Job({ id: jobId }).fetch({ withRelated: ['build.repository'] })
      .then(job => {
        if (!job) {
          reject();
        }

        return job.toJSON();
      })
      .then(job => {
        getBuild(job.builds_id)
          .then(build => {
            new Job()
              .query(q => {
                q.innerJoin('builds', 'jobs.builds_id', 'builds.id')
                .where('builds.head_github_id', build.head_github_id)
                .andWhere('jobs.id', '<=', job.id)
                .andWhere('jobs.status', 'success')
                .andWhere('jobs.test_script', job.test_script)
                .andWhere('jobs.language_version', job.language_version)
                .whereNotNull('jobs.start_time')
                .whereNotNull('jobs.end_time')
                .orderBy('jobs.id', 'desc');
              })
              .fetch()
              .then(lastJob => {
                job.lastJob = lastJob;

                resolve(job);
              });
          });
      });
  });
}

export function insertJob(data: any): Promise<any> {
  return new Promise((resolve, reject) => {
    new Job(data).save(null, { method: 'insert' }).then(job => {
      if (!job) {
        reject();
      }

      resolve(job.toJSON());
    });
  });
}

export function updateJob(data: any): Promise<any> {
  return new Promise((resolve, reject) => {
    new Job({ id: data.id }).save(data, { method: 'update', require: false }).then(job => {
      const jobId = data.id;
      new Job({ id: jobId }).save(data, { method: 'update', require: false }).then(() => {
        getJob(jobId).then(job => resolve(job));
      });
    });
  });
}

export function resetJobs(buildId: number): Promise<any> {
  return new Promise((resolve, reject) => {
    const data = {
      start_time: new Date(),
      end_time: null,
      status: 'queued',
      log: ''
    };

    new Job().where({ builds_id: buildId }).save(data, { method: 'update', require: false })
      .then(jobs => {
        if (!jobs) {
          reject();
        } else {
          new Job().where({ builds_id: buildId }).fetchAll()
            .then(jobs => jobs ? resolve(jobs.toJSON()) : reject(jobs));
        }
    });
  });
}

export function resetJob(jobId: number): Promise<any> {
  return new Promise((resolve, reject) => {
    const data = {
      start_time: new Date(),
      end_time: null,
      status: 'queued',
      log: ''
    };

    new Job({ id: jobId }).save(data, { method: 'update', require: false }).then(() => {
      getJob(jobId).then(job => resolve(job));
    });
  });
}
