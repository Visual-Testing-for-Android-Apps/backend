CREATE TABLE IF NOT EXISTS IMAGE_JOB(
    job_id  BIGINT NOT NULL REFERENCES JOB(job_id),
    /*job_status INTEGER NOT NULL DEFAULT 0,*/
    CONSTRAINT pk_image_job PRIMARY KEY(job_id)
);

CREATE TABLE IF NOT EXISTS IMAGE_STATUS(
    imstat_id    INTEGER CONSTRAINT pk_imstat PRIMARY KEY,
    imstat_name  TEXT NOT NULL
);

INSERT INTO IMAGE_STATUS(imstat_id, imstat_name) VALUES
    (0, 'WAITING'),
    (1, 'PREPROCESSING'),
    (2, 'PREPROCESSED'),
    (3, 'PROCESSING'),
    (4, 'PROCESSED');

/*IMAGE may be a reserved name*/
CREATE TABLE IF NOT EXISTS IMAGE(
    image_id        BIGINT GENERATED ALWAYS AS IDENTITY,
    job_id          BIGINT NOT NULL REFERENCES IMAGE_JOB(job_id),
    image_path      TEXT NOT NULL,
    image_status    INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT pk_image PRIMARY KEY(image_id),
    CONSTRAINT fk_image_status
        FOREIGN KEY(image_status)
        REFERENCES IMAGE_STATUS(imstat_id)
        ON DELETE SET DEFAULT,
);

CREATE TABLE IF NOT EXISTS IMAGE_RESULT_TAG(
    imrestag_id     INTEGER CONSTRAINT pk_imrestag PRIMARY KEY,
    imrestag_name   TEXT NOT NULL,
    imrestag_desc   TEXT NOT NULL
);

INSERT INTO IMAGE_RESULT_TAG(imrestag_id, imrestag_name, imrestag_desc) VALUES
    (0, 'GENERIC', 'generic error');

CREATE TABLE IF NOT EXISTS IMAGE_RESULT(
    imresult_id         BIGINT GENERATED ALWAYS AS IDENTITY,
    image_id            BIGINT NOT NULL REFERENCES IMAGE(image_id),
    /*It would probably be better to have a table for heatmaps rather than directly storing the path here*/
    imresult_heatmap    TEXT NOT NULL,
    imresult_tag        INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT pk_imresult PRIMARY KEY(imresult_id),
    CONSTRAINT fk_imresult_tag
        FOREIGN KEY(imresult_tag)
        REFERENCES IMAGE_RESULT_TAG(imrestag_id)
        ON DELETE SET DEFAULT,
);