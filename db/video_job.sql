CREATE TABLE IF NOT EXISTS VIDEO_JOB(
    job_id  BIGINT NOT NULL REFERENCES JOB(job_id),
    /*job_status INTEGER NOT NULL DEFAULT 0,*/
    CONSTRAINT pk_video_job PRIMARY KEY(job_id)
);

CREATE TABLE IF NOT EXISTS VIDEO_STATUS(
    vidstat_id    INTEGER CONSTRAINT pk_vidstat PRIMARY KEY,
    vidstat_name  TEXT NOT NULL
);

INSERT INTO VIDEO_STATUS(vidstat_id, vidstat_name) VALUES
    (0, 'WAITING'),
    (1, 'PREPROCESSING'),
    (2, 'PREPROCESSED'),
    (3, 'PROCESSING'),
    (4, 'PROCESSED');

CREATE TABLE IF NOT EXISTS VIDEO_RESULT(
    vidres_id     INTEGER CONSTRAINT pk_imrestag PRIMARY KEY,
    vidres_name   TEXT NOT NULL,
    vidres_desc   TEXT NOT NULL
);

INSERT INTO VIDEO_RESULT(vidres_id, vidres_name, vidres_desc) VALUES
    (0, 'UNKNOWN', 'cannot place image in space'),
    (1, 'RESULT_1', 'Pass through other material'),
    (2, 'RESULT_2', 'Lack of scrimmed background'),
    (3, 'RESULT_3', 'Snackbar blocks bottom app bar'),
    (4, 'RESULT_4', 'Stack multiple banners'),
    (5, 'RESULT_5', 'Flip card to reveal information'),
    (6, 'RESULT_6', 'Move one card behind other card'),
    (7, 'RESULT_7', 'Stack multiple snackbars'),
    (8, 'RESULT_8', 'Lack of shadow')
    (9, 'RESULT_9', 'Invisible scrime of modal bottom sheet')

CREATE TABLE IF NOT EXISTS VIDEO(
    video_id        BIGINT GENERATED ALWAYS AS IDENTITY,
    job_id          BIGINT NOT NULL REFERENCES VIDEO_JOB(job_id),
    video_path      TEXT NOT NULL,
    video_status    INTEGER NOT NULL DEFAULT 0,
    video_result    INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT pk_video PRIMARY KEY(video_id),
    CONSTRAINT fk_video_status
        FOREIGN KEY(video_status)
        REFERENCES VIDEO_STATUS(vidstat_id)
        ON DELETE SET DEFAULT,
    CONSTRAINT fk_video_result
        FOREIGN KEY(video_result)
        REFERENCES VIDEO_RESULT(vidres_id)
        ON DELETE SET DEFAULT,
);