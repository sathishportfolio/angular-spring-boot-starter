package com.example.angularspring.repository.pagination;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

public class OffsetBasedPageRequest implements Pageable {

	private final int limit;
	private final int offset;
	private final Sort sort;

	public OffsetBasedPageRequest(int offset, int limit, Sort sort) {
		this.offset = Math.max(offset, 0);
		this.limit = limit < 1 ? 10 : limit;
		this.sort = sort;
	}

	@Override
	public int getPageNumber() {
		return offset / limit;
	}

	@Override
	public int getPageSize() {
		return limit;
	}

	@Override
	public long getOffset() {
		return offset;
	}

	@Override
	public Sort getSort() {
		return sort;
	}

	@Override
	public Pageable next() {
		return new OffsetBasedPageRequest((int) getOffset() + getPageSize(), getPageSize(), getSort());
	}

	@Override
	public Pageable previousOrFirst() {
		return hasPrevious() ? new OffsetBasedPageRequest((int) getOffset() - getPageSize(), getPageSize(), getSort())
				: first();
	}

	@Override
	public Pageable first() {
		return new OffsetBasedPageRequest(0, getPageSize(), getSort());
	}

	@Override
	public Pageable withPage(int pageNumber) {
		return new OffsetBasedPageRequest(pageNumber * getPageSize(), getPageSize(), getSort());
	}

	@Override
	public boolean hasPrevious() {
		return offset > 0;
	}
}
