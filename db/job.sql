CREATE TABLE IF NOT EXISTS JOB_STATUS(
    jstat_id    INTEGER CONSTRAINT pk_jstat PRIMARY KEY,
    jstat_name  TEXT NOT NULL
);

INSERT INTO JOB_STATUS(jstat_id, jstat_name) VALUES
    (0, 'NONE'),
    (1, 'WAITING'),
    (2, 'FINISHED');

CREATE TABLE IF NOT EXISTS JOB(
    job_id      BIGINT GENERATED ALWAYS AS IDENTITY,
    job_email   TEXT NOT NULL,
    job_start   TIMESTAMPTZ NOT NULL,
    job_end     TIMESTAMPTZ,
    job_image   INTEGER NOT NULL DEFAULT 0,
    job_video   INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT pk_job PRIMARY KEY(job_id),
    CONSTRAINT fk_job_image
        FOREIGN KEY(job_image)
        REFERENCES JOB_STATUS(jstat_id)
        ON DELETE SET DEFAULT,
    CONSTRAINT fk_job_video
        FOREIGN KEY(job_video)
        REFERENCES JOB_STATUS(jstat_id)
        ON DELETE SET DEFAULT
);


/*Tables may also be needed for reposts, to avoid sending around large packets of text*/